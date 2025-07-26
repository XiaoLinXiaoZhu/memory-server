/**
 * Zettelkasten 工具处理器
 * 实现基于记忆片段盒方法的记忆管理工具
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
    extractContent: createExtractContentHandler(manager),
    insertLinkAt: createInsertLinkAtHandler(manager),
    getBacklinks: createGetBacklinksHandler(manager),
  };
}

/**
 * 获取记忆片段内容处理器
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
        '\n\n💡 **提示**：内容较长，可使用 extractContent 工具（支持精确范围定位）拆分为更小的记忆片段。' : '';

      const blankFill = "<!-- 这是一个自动创建的占位记忆片段 -->";
      const suggestFillBlank = content.includes(blankFill) ? `\n\n💡 **提示**：当前记忆片段是其他地方创建链接后的占位记忆片段，你可以通过 getBacklinks 工具查看所有指向该记忆片段的链接，然后使用 setContent 工具填充内容。` : '';

      return {
        content: [{
          type: "text" as const,
          text: `📄 **记忆片段: ${cardName}**${expansionInfo}\n\n${content}${optimizationHint}${suggestFillBlank}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 获取记忆片段内容失败: ${error instanceof Error ? error.message : String(error)}\n\n💡 **提示**：如需探索记忆片段结构，可以使用 getHints 工具获取相关提示。`
        }]
      };
    }
  };
}

/**
 * 设置记忆片段内容处理器
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
          text: `✅ 记忆片段 "${cardName}" 已保存成功\n\n💡 **提示**：内容创建后，可使用 insertLinkAt 工具 再其他记忆片段中插入链接，保持知识网络的连贯性。或者使用 getBacklinks 工具查看反向链接。`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 保存记忆片段失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  };
}

/**
 * 删除记忆片段内容处理器
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
          text: `🗑️ 记忆片段 "${cardName}" 已删除成功`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 删除记忆片段失败: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  };
}

/**
 * 重命名记忆片段内容处理器
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
          text: `✅ 记忆片段 "${oldCardName}" 已重命名为 "${newCardName}"\n\n💡 **提示**：重构完成后，可使用 getSuggestions 工具检查是否需要进一步优化。`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 重命名记忆片段失败: ${error instanceof Error ? error.message : String(error)}`
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
      
      // const hintText = hints.cardNames.length > 0 
      //   ? `🔍 **重要记忆片段提示** (按权重排序)\n\n${hints.cardNames.map((card: string, index: number) => `${index + 1}. [[${card}]]`).join('\n')}\n\n📊 权重详情:\n${hints.weights.map((w: any) => `- ${w.cardName}: ${w.weight.toFixed(3)}`).join('\n')}\n\n💡 **提示**：这些高权重记忆片段是知识网络的核心节点。如需优化整体结构，可使用 getSuggestions 工具查看低价值记忆片段的优化建议。`
      //   : '📭 暂无记忆片段\n\n💡 开始创建记忆片段后，可使用 getSuggestions 工具获取优化建议。';
      // 上面的方法把 全部的 weights 打印出来了，可能不太合适，我们只需打印 fileCount 个
      const hintText = hints.cardNames.length > 0 
        ? `🔍 **重要记忆片段提示** (按权重排序)\n\n${hints.cardNames.slice(0, fileCount).map((card: string, index: number) => `${index + 1}. [[${card}]]`).join('\n')}\n\n💡 **提示**：这些高权重记忆片段是知识网络的核心节点。如需优化整体结构，可使用 getSuggestions 工具查看低价值记忆片段的优化建议。`
        : '📭 暂无记忆片段\n\n💡 开始创建记忆片段后，可使用 getSuggestions 工具获取优化建议。'; 
      
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
      
      let suggestionText = `🔧 **优化建议** (低价值记忆片段)\n\n`;
      
      // 价值计算原理说明
      suggestionText += `📊 **价值计算原理**\n`;
      suggestionText += `• 价值 = 权重 / 字符数\n`;
      suggestionText += `• 权重取决于链接数量：链接越多，串联的上下文越多，价值越高\n`;
      suggestionText += `• 字符数越少，信息密度越高，价值越高\n`;
      suggestionText += `• 高价值记忆片段能够有效串联知识网络，避免信息孤岛\n\n`;
      
      if (suggestions.cardNames.length > 0) {
        suggestionText += `📋 **需要优化的记忆片段**\n`;
        suggestionText += suggestions.values.map((card: any, index: number) => 
          `${index + 1}. [[${card.cardName}]] (价值: ${card.value.toFixed(4)}, 权重: ${card.weight.toFixed(2)}, 字符数: ${card.characterCount})`
        ).join('\n');
        
        suggestionText += `\n\n� **优化策略建议**\n`;
        suggestionText += `\n**核心原则：拆分并聚类胜过单纯总结**\n`;
        suggestionText += `• 单纯总结会丢失情绪、环境等重要上下文信息\n`;
        suggestionText += `• 通过 extractContent 工具进行"精确范围拆分"更有效\n\n`;
        
        suggestionText += `**具体操作步骤：**\n`;
        suggestionText += `1. **识别联系紧密的内容块**：在单个记忆片段中找到可以独立成概念的部分\n`;
        suggestionText += `2. **使用 extractContent 精确拆分**：通过行号或正则表达式精确定位内容范围进行提取\n`;
        suggestionText += `3. **建立知识链接**：提取后原位置自动替换为链接，保持知识网络连接\n`;
        suggestionText += `4. **避免多记忆片段对比**：专注单个记忆片段的内部拆分，而非跨记忆片段合并\n\n`;
        
        suggestionText += `**推荐工具使用：**\n`;
        suggestionText += `• 使用 extractContent 进行精确范围内容拆分\n`;
        suggestionText += `• 使用 insertLinkAt 在相关记忆片段间建立连接\n`;
        suggestionText += `• 使用 getSuggestions 定期检查优化机会\n`;
        suggestionText += `• 使用 getHints 查看高价值记忆片段作为参考模式\n`;
        suggestionText += `• 使用 getBacklinks 了解记忆片段间的引用关系\n`;
        
        suggestionText += `\n💡 通过这种方式可以简单有效地提升记忆片段价值，构建更强的知识网络`;
      } else {
        suggestionText += '✨ 所有记忆片段的价值都在阈值之上，知识结构已经相当优化！\n\n';
        suggestionText += `🎯 **维护建议**\n`;
        suggestionText += `• 定期使用 getSuggestions 检查新增内容\n`;
        suggestionText += `• 继续使用 extractContent 精确拆分长内容\n`;
        suggestionText += `• 使用 insertLinkAt 和 getBacklinks 维护知识网络连接\n`;
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
 * 内容提取处理器 - 支持精确范围定位
 */
function createExtractContentHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { from, to, range } = args;
      
      if (!from || typeof from !== 'string') {
        throw new Error('from is required and must be a string');
      }
      
      if (!to || typeof to !== 'string') {
        throw new Error('to is required and must be a string');
      }

      if (!range) {
        throw new Error('range is required. Use start and/or end properties to specify extraction range.');
      }

      await manager.extractContent(from, to, range);
      
      return {
        content: [{
          type: "text" as const,
          text: `✅ **内容提取成功**\n\n从记忆片段 [[${from}]] 中提取内容到 [[${to}]]，并在原位置替换为链接。`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 内容提取失败: ${error instanceof Error ? error.message : String(error)}\n\n💡 **提示**：请检查范围参数格式，支持 start/end 属性配合 line 和 regex 使用。`
        }]
      };
    }
  };
}

/**
 * 插入链接处理器
 */
function createInsertLinkAtHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { sourceCardName, targetCardName, linePosition, anchorText } = args;
      
      if (!sourceCardName || typeof sourceCardName !== 'string') {
        throw new Error('sourceCardName is required and must be a string');
      }
      
      if (!targetCardName || typeof targetCardName !== 'string') {
        throw new Error('targetCardName is required and must be a string');
      }

      await manager.insertLinkAt(sourceCardName, targetCardName, linePosition, anchorText);
      
      const positionText = linePosition !== undefined ? 
        (linePosition === 0 ? '末尾' : 
         linePosition > 0 ? `第${linePosition}行` : 
         `倒数第${Math.abs(linePosition)}行`) : '末尾';
      
      const anchorInfo = anchorText ? ` (锚文本: "${anchorText}")` : '';
      
      return {
        content: [{
          type: "text" as const,
          text: `✅ **链接插入成功**\n\n在记忆片段 [[${sourceCardName}]] 的${positionText}插入了指向 [[${targetCardName}]] 的链接${anchorInfo}。`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 链接插入失败: ${error instanceof Error ? error.message : String(error)}\n\n💡 **提示**：请检查源记忆片段是否存在，行号位置是否有效。`
        }]
      };
    }
  };
}

/**
 * 获取反向链接处理器
 */
function createGetBacklinksHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { cardName } = args;
      
      if (!cardName || typeof cardName !== 'string') {
        throw new Error('cardName is required and must be a string');
      }

      const backlinks = await manager.getBacklinks(cardName);
      
      if (backlinks.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: `📎 **反向链接查询结果**\n\n记忆片段 [[${cardName}]] 暂无其他记忆片段引用。\n\n💡 **提示**：可以使用 insertLinkAt 工具在其他相关记忆片段中添加对此记忆片段的引用。`
          }]
        };
      }
      
      const backlinksList = backlinks.map(name => `• [[${name}]]`).join('\n');
      
      return {
        content: [{
          type: "text" as const,
          text: `📎 **反向链接查询结果**\n\n记忆片段 [[${cardName}]] 被以下 ${backlinks.length} 个记忆片段引用:\n\n${backlinksList}\n\n💡 **提示**：这些反向链接显示了知识网络中的连接关系，有助于发现相关内容。`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 获取反向链接失败: ${error instanceof Error ? error.message : String(error)}`
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
    description: "获取指定记忆片段的内容，支持递归展开引用的其他记忆片段",
    inputSchema: {
      type: "object",
      properties: {
        cardName: {
          type: "string",
          description: "要获取内容的记忆片段名称"
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
    description: "创建或更新记忆片段的内容。支持使用 [[记忆片段名]] 语法引用其他记忆片段",
    inputSchema: {
      type: "object",
      properties: {
        cardName: {
          type: "string",
          description: "要设置内容的记忆片段名称"
        },
        content: {
          type: "string",
          description: "记忆片段的内容，支持 Markdown 格式和 [[记忆片段名]] 引用语法"
        }
      },
      required: ["cardName", "content"]
    }
  },
  {
    name: "deleteContent",
    description: "删除指定的记忆片段",
    inputSchema: {
      type: "object",
      properties: {
        cardName: {
          type: "string",
          description: "要删除的记忆片段名称"
        }
      },
      required: ["cardName"]
    }
  },
  {
    name: "renameContent",
    description: "重命名记忆片段或将两个记忆片段合并。如果目标记忆片段已存在，会将内容合并。同时更新所有引用了旧记忆片段的地方",
    inputSchema: {
      type: "object",
      properties: {
        oldCardName: {
          type: "string",
          description: "原记忆片段名称"
        },
        newCardName: {
          type: "string",
          description: "新记忆片段名称"
        }
      },
      required: ["oldCardName", "newCardName"]
    }
  },
  {
    name: "getHints",
    description: "获取按权重排序的重要记忆片段提示。权重通过递归计算记忆片段引用关系得出。用于发现知识网络的核心节点。如需优化整体结构，建议配合 getSuggestions 使用",
    inputSchema: {
      type: "object",
      properties: {
        fileCount: {
          type: "number",
          description: "返回的记忆片段数量",
          default: 10,
          minimum: 1,
          maximum: 100
        }
      }
    }
  },
  {
    name: "getSuggestions",
    description: "获取优化建议，识别价值较低的记忆片段进行优化。价值 = 权重 / 字符数。提供详细的优化策略，包括拆分、聚类等方法。当记忆片段数量较多或想要改善知识网络质量时使用",
    inputSchema: {
      type: "object",
      properties: {
        optimizationThreshold: {
          type: "number",
          description: "优化阈值，价值低于此值的记忆片段会被标记为需要优化",
          default: 0.1,
          minimum: 0,
          maximum: 1
        },
        maxFileCount: {
          type: "number",
          description: "返回的低价值记忆片段最大数量",
          default: 10,
          minimum: 1,
          maximum: 50
        }
      }
    }
  },
  {
    name: "extractContent",
    description: "内容提取功能 - 支持精确范围定位。通过行号和正则表达式精确定位内容范围进行提取，解决AI需要完整复述内容的问题。这是 getSuggestions 推荐的主要优化方法",
    inputSchema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "源记忆片段名称"
        },
        to: {
          type: "string",
          description: "目标记忆片段名称"
        },
        range: {
          type: "object",
          description: "提取范围定义",
          properties: {
            start: {
              type: "object",
              description: "开始位置",
              properties: {
                line: {
                  type: "number",
                  description: "起始行号（1-based），如果不提供则从文件开头开始",
                  minimum: 1
                },
                regex: {
                  type: "string",
                  description: "正则表达式匹配，从指定行号开始搜索匹配的内容"
                }
              }
            },
            end: {
              type: "object", 
              description: "结束位置",
              properties: {
                line: {
                  type: "number",
                  description: "结束行号（1-based），如果不提供则从文件结尾开始",
                  minimum: 1
                },
                regex: {
                  type: "string",
                  description: "正则表达式匹配，从指定行号开始倒过来搜索匹配的内容"
                }
              }
            }
          }
        }
      },
      required: ["from", "to", "range"]
    }
  },
  {
    name: "insertLinkAt",
    description: "在指定位置插入记忆片段链接。解决了需要完整输出文件内容才能添加链接的问题，可以精确指定插入位置",
    inputSchema: {
      type: "object",
      properties: {
        sourceCardName: {
          type: "string",
          description: "源记忆片段名称（要在其中插入链接的记忆片段）"
        },
        targetCardName: {
          type: "string", 
          description: "目标记忆片段名称（要链接到的记忆片段）"
        },
        linePosition: {
          type: "number",
          description: "行号位置。正数表示从文件开头计数（1-based），负数表示从文件末尾计数，0或不提供则默认添加到文件末尾"
        },
        anchorText: {
          type: "string",
          description: "链接的锚文本，可选。如果提供，链接格式为 '锚文本 [[目标记忆片段]]'，否则为 '[[目标记忆片段]]'"
        }
      },
      required: ["sourceCardName", "targetCardName"]
    }
  },
  {
    name: "getBacklinks", 
    description: "获取指定记忆片段的所有反向链接。返回引用指定记忆片段的其他记忆片段名称列表，有助于了解知识网络中的连接关系",
    inputSchema: {
      type: "object",
      properties: {
        cardName: {
          type: "string",
          description: "要查询反向链接的记忆片段名称"
        }
      },
      required: ["cardName"]
    }
  }
];
