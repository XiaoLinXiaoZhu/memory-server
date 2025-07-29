#!/usr/bin/env node

/**
 * Zettelkasten Memory Server
 * 基于 Zettelkasten 记忆片段盒方法的 MCP 记忆服务器
 * 提供简化的记忆片段化记忆管理功能
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { createZettelkastenHandlers } from './handlers/zettelkastenHandlers.js';
import { listZettelkastenResources, readZettelkastenResource } from './handlers/resourceHandlers.js';
import { listPrompts, generatePrompt } from './handlers/promptHandlers.js';
import { ToolRegistry } from './types/index.js';

// 默认存储目录（用户可以通过环境变量覆盖）
const DEFAULT_STORAGE_DIR = './zettelkasten-cards';
const STORAGE_DIR = process.env.ZETTELKASTEN_STORAGE_DIR || DEFAULT_STORAGE_DIR;

/**
 * 创建 MCP 服务器，提供 Zettelkasten 记忆管理功能
 */
const server = new Server(
  {
    name: "zettelkasten-memory-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// 创建 Zettelkasten 管理器
const zettelkastenManager = new ZettelkastenManager({
  storageDir: STORAGE_DIR,
  encoding: 'utf-8',
  autoCreateDir: true
});

// 创建工具处理器
const handlers = createZettelkastenHandlers(zettelkastenManager);

// 工具定义映射
const TOOL_DEFINITIONS: Record<string, { description: string, inputSchema: any }> = {
  getContent: {
    description: "获取指定记忆片段的内容，支持递归展开引用的其他记忆片段",
    inputSchema: {
      type: "object",
      properties: {
        cardName: { type: "string", description: "要获取内容的记忆片段名称" },
        expandDepth: { type: "number", description: "展开深度，0表示不展开引用，1表示展开一层引用，以此类推", default: 0, minimum: 0, maximum: 10 },
        withLineNumber: { type: "boolean", description: "是否输出带行号的内容，默认false", default: false }
      },
      required: ["cardName"]
    }
  },
  setContent: {
    description: "创建或更新记忆片段的内容。支持使用 [[记忆片段名]] 语法引用其他记忆片段",
    inputSchema: {
      type: "object",
      properties: {
        cardName: { type: "string", description: "要设置内容的记忆片段名称" },
        content: { type: "string", description: "记忆片段的内容，支持 Markdown 格式和 [[记忆片段名]] 引用语法" }
      },
      required: ["cardName", "content"]
    }
  },
  deleteContent: {
    description: "删除指定的记忆片段",
    inputSchema: {
      type: "object",
      properties: {
        cardName: { type: "string", description: "要删除的记忆片段名称" }
      },
      required: ["cardName"]
    }
  },
  renameContent: {
    description: "重命名记忆片段或将两个记忆片段合并。如果目标记忆片段已存在，会将内容合并。同时更新所有引用了旧记忆片段的地方",
    inputSchema: {
      type: "object",
      properties: {
        oldCardName: { type: "string", description: "原记忆片段名称" },
        newCardName: { type: "string", description: "新记忆片段名称" }
      },
      required: ["oldCardName", "newCardName"]
    }
  },
  getHints: {
    description: "获取按权重排序的重要记忆片段提示。权重通过递归计算记忆片段引用关系得出。用于发现知识网络的核心节点。如需优化整体结构，建议配合 getSuggestions 使用",
    inputSchema: {
      type: "object",
      properties: {
        fileCount: { type: "number", description: "返回的记忆片段数量", default: 10, minimum: 1, maximum: 100 }
      }
    }
  },
  getSuggestions: {
    description: "获取优化建议，识别价值较低的记忆片段进行优化。价值 = 权重 / 字符数。提供详细的优化策略，包括拆分、聚类等方法。当记忆片段数量较多或想要改善知识网络质量时使用",
    inputSchema: {
      type: "object",
      properties: {
        optimizationThreshold: { type: "number", description: "优化阈值，价值低于此值的记忆片段会被标记为需要优化", default: 0.1, minimum: 0, maximum: 1 },
        maxFileCount: { type: "number", description: "返回的低价值记忆片段最大数量", default: 10, minimum: 1, maximum: 50 }
      }
    }
  },
  extractContent: {
    description: "内容提取功能 - 支持精确范围定位。通过行号和正则表达式精确定位内容范围进行提取，解决AI需要完整复述内容的问题。这是 getSuggestions 推荐的主要优化方法",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "源记忆片段名称" },
        to: { type: "string", description: "目标记忆片段名称" },
        range: {
          type: "object",
          description: "提取范围定义",
          properties: {
            start: {
              type: "object",
              description: "开始位置",
              properties: {
                line: { type: "number", description: "起始行号（1-based），如果不提供则从文件开头开始", minimum: 1 },
                regex: { type: "string", description: "正则表达式匹配，从指定行号开始搜索匹配的内容" }
              }
            },
            end: {
              type: "object",
              description: "结束位置",
              properties: {
                line: { type: "number", description: "结束行号（1-based），如果不提供则从文件结尾开始", minimum: 1 },
                regex: { type: "string", description: "正则表达式匹配，从指定行号开始倒过来搜索匹配的内容" }
              }
            }
          }
        }
      },
      required: ["from", "to", "range"]
    }
  },
  insertLinkAt: {
    description: "在指定位置插入记忆片段链接。解决了需要完整输出文件内容才能添加链接的问题，可以精确指定插入位置",
    inputSchema: {
      type: "object",
      properties: {
        sourceCardName: { type: "string", description: "源记忆片段名称（要在其中插入链接的记忆片段）" },
        targetCardName: { type: "string", description: "目标记忆片段名称（要链接到的记忆片段）" },
        linePosition: { type: "number", description: "行号位置。正数表示从文件开头计数（1-based），负数表示从文件末尾计数，0或不提供则默认添加到文件末尾" },
        anchorText: { type: "string", description: "链接的锚文本，可选。如果提供，链接格式为 '锚文本 [[目标记忆片段]]'，否则为 '[[目标记忆片段]]'" }
      },
      required: ["sourceCardName", "targetCardName"]
    }
  },
  getBacklinks: {
    description: "获取指定记忆片段的所有反向链接。返回引用指定记忆片段的其他记忆片段名称列表，有助于了解知识网络中的连接关系",
    inputSchema: {
      type: "object",
      properties: {
        cardName: { type: "string", description: "要查询反向链接的记忆片段名称" }
      },
      required: ["cardName"]
    }
  }
};

// 创建工具注册表
const toolRegistry: ToolRegistry = {};
for (const name of Object.keys(handlers)) {
  toolRegistry[name] = {
    definition: { name, ...TOOL_DEFINITIONS[name] },
    handler: handlers[name as keyof typeof handlers]
  };
}

/**
 * 工具处理器：列出可用的 Zettelkasten 工具
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.keys(handlers).map(name => ({ name, ...TOOL_DEFINITIONS[name] }))
  };
});

/**
 * 资源处理器：列出所有 Zettelkasten 记忆片段作为资源
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return await listZettelkastenResources(zettelkastenManager);
});

/**
 * 资源处理器：读取特定记忆片段的内容
 * 支持 memory:///fileName#expandDepth 格式，等效于 getContent(fileName, expandDepth)
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return await readZettelkastenResource(zettelkastenManager, request.params.uri);
});

/**
 * 提示处理器：列出可用的提示模板
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return listPrompts();
});

/**
 * 提示处理器：生成特定的提示内容
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  return await generatePrompt(zettelkastenManager, request.params.name, request.params.arguments as Record<string, any>);
});

/**
 * 工具调用处理器：执行具体的 Zettelkasten 操作
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = (request.params.arguments as Record<string, any>) || {};

  const tool = toolRegistry[toolName];
  if (!tool) {
    return {
      content: [{
        type: "text" as const,
        text: `❌ 未知工具: ${toolName}`
      }]
    };
  }

  try {
    return await tool.handler(args);
  } catch (error) {
    console.error(`工具 "${toolName}" 执行失败:`, error);
    return {
      content: [{
        type: "text" as const,
        text: `❌ 工具执行失败: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
});

/**
 * 启动服务器
 */
async function main() {
  console.error(`🚀 启动 Zettelkasten Memory Server`);
  console.error(`📁 存储目录: ${STORAGE_DIR}`);
  console.error(`💡 提示: 可以通过 ZETTELKASTEN_STORAGE_DIR 环境变量指定存储目录`);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error(`✅ 服务器已启动并连接`);
}

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.error('\n🛑 收到 SIGINT 信号，正在优雅关闭...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\n🛑 收到 SIGTERM 信号，正在优雅关闭...');
  process.exit(0);
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

main().catch((error) => {
  console.error("❌ 服务器启动失败:", error);
  process.exit(1);
});
