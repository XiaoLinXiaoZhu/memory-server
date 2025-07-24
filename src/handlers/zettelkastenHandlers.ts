/**
 * Zettelkasten 工具处理器
 * 实现基于卡片盒方法的记忆管理工具
 */

import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolDefinition, ToolHandler } from '../types/index.js';

/**
 * 创建工具处理器函数
 */
export function createZettelkastenHandlers(manager: ZettelkastenManager) {
  return {
    getContent: createGetContentHandler(manager),
    setContent: createSetContentHandler(manager),
    deleteContent: createDeleteContentHandler(manager),
    renameContent: createRenameContentHandler(manager),
    getHints: createGetHintsHandler(manager),
    getSuggestions: createGetSuggestionsHandler(manager),
    extractContent: createextractContentHandler(manager),
  };
}

/**
 * 获取卡片内容处理器
 */
function createGetContentHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { cardName, expandDepth = 0 } = args;
      
      if (!cardName || typeof cardName !== 'string') {
        throw new Error('cardName is required and must be a string');
      }

      const content = await manager.getContent(cardName, expandDepth);
      
      const expansionInfo = expandDepth > 0 ? ` (展开深度: ${expandDepth})` : '';
      const optimizationHint = content.length > 1000 ? 
        '\n\n💡 **提示**：内容较长，可使用 extractContent 工具拆分为更小的卡片，或通过 getSuggestions 获取优化建议。' : '';
      
      return {
        content: [{
          type: "text" as const,
          text: `📄 **卡片: ${cardName}**${expansionInfo}\n\n${content}${optimizationHint}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 获取卡片内容失败: ${error instanceof Error ? error.message : String(error)}\n\n💡 **提示**：如需管理现有卡片，可使用 getSuggestions 获取优化建议。`
        }]
      };
    }
  };
}

/**
 * 设置卡片内容处理器
 */
function createSetContentHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { cardName, content } = args;
      
      if (!cardName || typeof cardName !== 'string') {
        throw new Error('cardName is required and must be a string');
      }
      
      if (!content || typeof content !== 'string') {
        throw new Error('content is required and must be a string');
      }

      await manager.setContent(cardName, content);
      
      return {
        content: [{
          type: "text" as const,
          text: `✅ 卡片 "${cardName}" 已保存成功\n\n💡 **提示**：内容创建后，可使用 getSuggestions 工具获取优化建议，保持知识网络的质量。`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 保存卡片失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  };
}

/**
 * 删除卡片内容处理器
 */
function createDeleteContentHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { cardName } = args;
      
      if (!cardName || typeof cardName !== 'string') {
        throw new Error('cardName is required and must be a string');
      }

      await manager.deleteContent(cardName);
      
      return {
        content: [{
          type: "text" as const,
          text: `🗑️ 卡片 "${cardName}" 已删除成功`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 删除卡片失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  };
}

/**
 * 重命名卡片内容处理器
 */
function createRenameContentHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { oldCardName, newCardName } = args;
      
      if (!oldCardName || typeof oldCardName !== 'string') {
        throw new Error('oldCardName is required and must be a string');
      }
      
      if (!newCardName || typeof newCardName !== 'string') {
        throw new Error('newCardName is required and must be a string');
      }

      await manager.renameContent(oldCardName, newCardName);
      
      return {
        content: [{
          type: "text" as const,
          text: `✅ 卡片 "${oldCardName}" 已重命名为 "${newCardName}"\n\n💡 **提示**：重构完成后，可使用 getSuggestions 工具检查是否需要进一步优化。`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 重命名卡片失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  };
}

/**
 * 获取提示处理器
 */
function createGetHintsHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { fileCount = 10 } = args;
      
      const hints = await manager.getHints(fileCount);
      
      const hintText = hints.cardNames.length > 0 
        ? `🔍 **重要卡片提示** (按权重排序)\n\n${hints.cardNames.map((card: string, index: number) => `${index + 1}. [[${card}]]`).join('\n')}\n\n📊 权重详情:\n${hints.weights.map((w: any) => `- ${w.cardName}: ${w.weight.toFixed(3)}`).join('\n')}\n\n💡 **提示**：这些高权重卡片是知识网络的核心节点。如需优化整体结构，可使用 getSuggestions 工具查看低价值卡片的优化建议。`
        : '📭 暂无卡片\n\n💡 开始创建卡片后，可使用 getSuggestions 工具获取优化建议。';
      
      return {
        content: [{
          type: "text" as const,
          text: hintText
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 获取提示失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  };
}

/**
 * 获取优化建议处理器
 */
function createGetSuggestionsHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { optimizationThreshold = 0.1, maxFileCount = 10 } = args;
      
      const suggestions = await manager.getSuggestions(optimizationThreshold, maxFileCount);
      
      let suggestionText = `🔧 **优化建议** (低价值卡片)\n\n`;
      
      // 价值计算原理说明
      suggestionText += `📊 **价值计算原理**\n`;
      suggestionText += `• 价值 = 权重 / 字符数\n`;
      suggestionText += `• 权重取决于链接数量：链接越多，串联的上下文越多，价值越高\n`;
      suggestionText += `• 字符数越少，信息密度越高，价值越高\n`;
      suggestionText += `• 高价值卡片能够有效串联知识网络，避免信息孤岛\n\n`;
      
      if (suggestions.cardNames.length > 0) {
        suggestionText += `📋 **需要优化的卡片**\n`;
        suggestionText += suggestions.values.map((card: any, index: number) => 
          `${index + 1}. [[${card.cardName}]] (价值: ${card.value.toFixed(4)}, 权重: ${card.weight.toFixed(2)}, 字符数: ${card.characterCount})`
        ).join('\n');
        
        suggestionText += `\n\n� **优化策略建议**\n`;
        suggestionText += `\n**核心原则：拆分并聚类胜过单纯总结**\n`;
        suggestionText += `• 单纯总结会丢失情绪、环境等重要上下文信息\n`;
        suggestionText += `• 通过 extractContent 工具进行"无脑拆分"更有效\n\n`;
        
        suggestionText += `**具体操作步骤：**\n`;
        suggestionText += `1. **识别联系紧密的内容块**：在单个卡片中找到可以独立成概念的部分\n`;
        suggestionText += `2. **使用 extractContent 拆分**：将内容块提取为新卡片，原位置替换为 [[新卡片名]]\n`;
        suggestionText += `3. **建立知识链接**：通过链接创建知识网络，提高整体价值\n`;
        suggestionText += `4. **避免多卡片对比**：专注单个卡片的内部拆分，而非跨卡片合并\n\n`;
        
        suggestionText += `**推荐工具使用：**\n`;
        suggestionText += `• 使用 extractContent 进行内容拆分\n`;
        suggestionText += `• 使用 getSuggestions 定期检查优化机会\n`;
        suggestionText += `• 使用 getHints 查看高价值卡片作为参考模式\n`;
        
        suggestionText += `\n💡 通过这种方式可以简单有效地提升卡片价值，构建更强的知识网络`;
      } else {
        suggestionText += '✨ 所有卡片的价值都在阈值之上，知识结构已经相当优化！\n\n';
        suggestionText += `🎯 **维护建议**\n`;
        suggestionText += `• 定期使用 getSuggestions 检查新增内容\n`;
        suggestionText += `• 继续使用 extractContent 拆分长内容\n`;
        suggestionText += `• 保持知识网络的链接密度`;
      }
      
      return {
        content: [{
          type: "text" as const,
          text: suggestionText
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 获取优化建议失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  };
}

/**
 * 内容提取拆分处理器
 */
function createextractContentHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { from, content, to } = args;
      
      if (!from || typeof from !== 'string') {
        throw new Error('from is required and must be a string');
      }
      
      if (!content || typeof content !== 'string') {
        throw new Error('content is required and must be a string');
      }
      
      if (!to || typeof to !== 'string') {
        throw new Error('to is required and must be a string');
      }

      await manager.extractContent(from, content, to);
      
      return {
        content: [{
          type: "text" as const,
          text: `✅ **内容提取成功**\n\n从卡片 [[${from}]] 中提取内容到 [[${to}]]，并在原位置替换为链接。`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 内容提取失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  };
}

/**
 * 工具定义
 */
export const ZETTELKASTEN_TOOLS: ToolDefinition[] = [
  {
    name: "getContent",
    description: "获取指定卡片的内容，支持递归展开引用的其他卡片",
    inputSchema: {
      type: "object",
      properties: {
        cardName: {
          type: "string",
          description: "要获取内容的卡片名称"
        },
        expandDepth: {
          type: "number",
          description: "展开深度，0表示不展开引用，1表示展开一层引用，以此类推",
          default: 0,
          minimum: 0,
          maximum: 10
        }
      },
      required: ["cardName"]
    }
  },
  {
    name: "setContent",
    description: "创建或更新卡片的内容。支持使用 [[卡片名]] 语法引用其他卡片",
    inputSchema: {
      type: "object",
      properties: {
        cardName: {
          type: "string",
          description: "要设置内容的卡片名称"
        },
        content: {
          type: "string",
          description: "卡片的内容，支持 Markdown 格式和 [[卡片名]] 引用语法"
        }
      },
      required: ["cardName", "content"]
    }
  },
  {
    name: "deleteContent",
    description: "删除指定的卡片",
    inputSchema: {
      type: "object",
      properties: {
        cardName: {
          type: "string",
          description: "要删除的卡片名称"
        }
      },
      required: ["cardName"]
    }
  },
  {
    name: "renameContent",
    description: "重命名卡片或将两个卡片合并。如果目标卡片已存在，会将内容合并。同时更新所有引用了旧卡片的地方",
    inputSchema: {
      type: "object",
      properties: {
        oldCardName: {
          type: "string",
          description: "原卡片名称"
        },
        newCardName: {
          type: "string",
          description: "新卡片名称"
        }
      },
      required: ["oldCardName", "newCardName"]
    }
  },
  {
    name: "getHints",
    description: "获取按权重排序的重要卡片提示。权重通过递归计算卡片引用关系得出。用于发现知识网络的核心节点。如需优化整体结构，建议配合 getSuggestions 使用",
    inputSchema: {
      type: "object",
      properties: {
        fileCount: {
          type: "number",
          description: "返回的卡片数量",
          default: 10,
          minimum: 1,
          maximum: 100
        }
      }
    }
  },
  {
    name: "getSuggestions",
    description: "获取优化建议，识别价值较低的卡片进行优化。价值 = 权重 / 字符数。提供详细的优化策略，包括拆分、聚类等方法。当卡片数量较多或想要改善知识网络质量时使用",
    inputSchema: {
      type: "object",
      properties: {
        optimizationThreshold: {
          type: "number",
          description: "优化阈值，价值低于此值的卡片会被标记为需要优化",
          default: 0.1,
          minimum: 0,
          maximum: 1
        },
        maxFileCount: {
          type: "number",
          description: "返回的低价值卡片最大数量",
          default: 10,
          minimum: 1,
          maximum: 50
        }
      }
    }
  },
  {
    name: "extractContent",
    description: "内容提取拆分功能。将指定卡片中的特定内容提取出来，创建新的卡片，并在原位置替换为链接。这是 getSuggestions 推荐的主要优化方法，用于将大卡片拆分为更小、更专注的卡片",
    inputSchema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "源卡片名称"
        },
        content: {
          type: "string",
          description: "要提取的内容"
        },
        to: {
          type: "string",
          description: "目标卡片名称"
        }
      },
      required: ["from", "content", "to"]
    }
  }
];
