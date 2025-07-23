#!/usr/bin/env node

/**
 * Zettelkasten Memory Server
 * 基于 Zettelkasten 卡片盒方法的 MCP 记忆服务器
 * 提供简化的卡片化记忆管理功能
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
import { createZettelkastenHandlers, ZETTELKASTEN_TOOLS } from './handlers/zettelkastenHandlers.js';
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

// 创建工具注册表
const toolRegistry: ToolRegistry = {};
for (const toolDef of ZETTELKASTEN_TOOLS) {
  const handler = handlers[toolDef.name as keyof typeof handlers];
  if (typeof handler === 'function') {
    toolRegistry[toolDef.name] = {
      definition: toolDef,
      handler
    };
  }
}

/**
 * 工具处理器：列出可用的 Zettelkasten 工具
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: ZETTELKASTEN_TOOLS
  };
});

/**
 * 资源处理器：列出所有 Zettelkasten 卡片作为资源
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return await listZettelkastenResources(zettelkastenManager);
});

/**
 * 资源处理器：读取特定卡片的内容
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
