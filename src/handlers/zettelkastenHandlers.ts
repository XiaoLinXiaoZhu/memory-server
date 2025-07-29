/**
 * Zettelkasten 工具处理器
 * 实现基于记忆片段盒方法的记忆管理工具
 */

import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolDefinition, ToolHandler } from '../types/index.js';

// 在文件顶部添加全局缓存
const latestContentFetched: Set<string> = new Set();

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

// 辅助函数：递归提取所有 [[链接]] 文件名
function extractLinkedCardNames(content: string) {
  const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;
  const result = new Set<string>();
  let match;
  while ((match = LINK_PATTERN.exec(content)) !== null) {
    result.add(match[1].trim());
  }
  return Array.from(result);
}

// 辅助函数：判断 EMPTY_PLACEHOLDER
function isEmptyPlaceholder(content: string) {
  return content && content.includes('<!-- 这是一个自动创建的占位记忆片段 -->');
}

/**
 * 获取记忆片段内容处理器
 */
function createGetContentHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { cardName, expandDepth = 0, withLineNumber = false } = args;
      
      if (!cardName || typeof cardName !== 'string') {
        throw new Error('cardName is required and must be a string');
      }

      let content;
      let notFound = false;
      let shouldReturnCached = false;


      // 如果已经获取过最新内容，直接返回缓存提示
      if (latestContentFetched.has(cardName)) {
        shouldReturnCached = true;
        latestContentFetched.add(cardName);
      }

      // 尝试获取文件内容,如果获取失败，则还是需要获取最新内容
      try {
        content = await manager.getContent(cardName, expandDepth, withLineNumber);
      } catch (e: any) {
        if (e && e.message && e.message.includes('Card not found')) {
          notFound = true;
          // 文件不存在时，标记为已获取（因为不存在内容）
          latestContentFetched.add(cardName);
          shouldReturnCached = false;
        }
        throw e;
      }

      // 检查是否为 EMPTY_PLACEHOLDER
      const isPlaceholder = isEmptyPlaceholder(content);
      
      // 如果文件不存在或为 EMPTY_PLACEHOLDER，标记为已获取
      if (notFound || isPlaceholder) {
        latestContentFetched.add(cardName);
        shouldReturnCached = false;
      }

      // 展开下级链接时，递归标记所有下级文件为最新内容
      for (let i = 0; i < expandDepth; i++) {
        // 每次展开深度增加，标记所有下级链接为最新内容
        const linked = extractLinkedCardNames(content);
        for (const link of linked) {
          latestContentFetched.add(link);
        }
      }

      // 检查是否应该返回缓存提示
      // 当 withLineNumber 为 true 时，忽略是否获取过，永远输出带行号的文件内容
      if (shouldReturnCached && !withLineNumber) {
        return {
          content: [{
            type: "text" as const,
            text: `✅ 记忆片段 "${cardName}" 的最新内容已在上下文中，无需重复获取。`
          }]
        };
      }

      let truncated = false;
      const MAX_LENGTH = 2048;
      if (content.length > MAX_LENGTH) {
        content = content.slice(0, MAX_LENGTH) + '\n...\n[内容过长已截断，请减少展开层次或手动获取细节内容]';
        truncated = true;
      }

      // 只有未被截断的内容才标记为已获取最新内容
      if (!truncated) {
        latestContentFetched.add(cardName);
      }

      const expansionInfo = expandDepth > 0 ? ` (展开深度: ${expandDepth})` : '';
      const optimizationHint = content.length > 1000 && !truncated ?
        '\n\n💡 **提示**：内容较长，可使用 extractContent 工具（支持精确范围定位）拆分为更小的记忆片段。' : '';

      const blankFill = "<!-- 这是一个自动创建的占位记忆片段 -->";
      const suggestFillBlank = content.includes(blankFill) ? `\n\n💡 **提示**：当前记忆片段是其他地方创建链接后的占位记忆片段，你可以通过 getBacklinks 工具查看所有指向该记忆片段的链接，然后使用 setContent 工具填充内容。` : '';

      const tooLongHint = truncated ? '\n\n⚠️ **警告**：内容已被截断，建议减少展开层次或手动获取细节内容。' : '';

      return {
        content: [{
          type: "text" as const,
          text: `📄 **记忆片段: ${cardName}**${expansionInfo}\n\n${content}${optimizationHint}${suggestFillBlank}${tooLongHint}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 获取记忆片段内容失败: ${error && error.message ? error.message : String(error)}\n\n💡 **提示**：如需探索记忆片段结构，可以使用 getHints 工具获取相关提示。`
        }]
      };
    }
  };
}

/**
 * 编辑操作前校验
 * 可编辑的条件为：1.文件不存在 或者 2.为自动生成的空文件 或者 3. 已经读取过，在读取了的列表内
 */
async function checkLatestContent(manager: ZettelkastenManager, cardName: string) {
  // 如果文件已经在已获取列表中，则允许编辑
  if (latestContentFetched.has(cardName)) {
    return;
  }
  
  // 检查文件是否存在，如果不存在则允许编辑（会自动创建）
  try {
    const content = await manager.getContent(cardName, 0, false);
    // 如果文件存在且不是自动生成的空文件，则需要先获取内容
    if (isEmptyPlaceholder(content)) {
      throw new Error(`为保证数据安全，编辑前请先使用 getContent 获取 "${cardName}" 的最新内容。`);
    }
  } catch (e: any) {
    // 如果文件不存在（Card not found错误），则允许编辑
    if (e && e.message && e.message.includes('Card not found')) {
      return;
    }
    throw e;
  }
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

      await checkLatestContent(manager, cardName);
      await manager.setContent(cardName, content);
      // 编辑后移除已获取最新内容标记，并自动标记为最新内容
      latestContentFetched.delete(cardName);
      latestContentFetched.add(cardName);
      
      return {
        content: [{
          type: "text" as const,
          text: `✅ 记忆片段 "${cardName}" 已保存成功\n\n💡 **提示**：内容创建后，可使用 insertLinkAt 工具 再其他记忆片段中插入链接，保持知识网络的连贯性。或者使用 getBacklinks 工具查看反向链接。`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 保存记忆片段失败: ${error && error.message ? error.message : String(error)}`
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

      await checkLatestContent(manager, cardName);
      await manager.deleteContent(cardName);
      // 编辑后移除已获取最新内容标记
      latestContentFetched.delete(cardName);
      
      return {
        content: [{
          type: "text" as const,
          text: `🗑️ 记忆片段 "${cardName}" 已删除成功`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 删除记忆片段失败: ${error && error.message ? error.message : String(error)}`
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

      await checkLatestContent(manager, oldCardName);
      await manager.renameContent(oldCardName, newCardName);
      // 编辑后移除已获取最新内容标记（旧文件和重命名目标）
      latestContentFetched.delete(oldCardName);
      latestContentFetched.delete(newCardName);
      
      return {
        content: [{
          type: "text" as const,
          text: `✅ 记忆片段 "${oldCardName}" 已重命名为 "${newCardName}"\n\n💡 **提示**：重构完成后，可使用 getSuggestions 工具检查是否需要进一步优化。`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 重命名记忆片段失败: ${error && error.message ? error.message : String(error)}`
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
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 获取提示失败: ${error && error.message ? error.message : String(error)}`
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
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 获取优化建议失败: ${error && error.message ? error.message : String(error)}`
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

      try {
        await checkLatestContent(manager, from);
      } catch (e: any) {
        throw new Error(`为保证内容一致性，请先使用 getContent 获取 "${from}" 的最新内容后再提取。`);
      }
      await manager.extractContent(from, to, range);
      // 编辑后移除已获取最新内容标记（源文件），并自动标记目标文件为最新内容
      latestContentFetched.delete(from);
      latestContentFetched.add(to);
      
      return {
        content: [{
          type: "text" as const,
          text: `✅ **内容提取成功**\n\n从记忆片段 [[${from}]] 中提取内容到 [[${to}]]，并在原位置替换为链接。`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 内容提取失败: ${error && error.message ? error.message : String(error)}\n\n💡 **提示**：请检查范围参数格式，支持 start/end 属性配合 line 和 regex 使用。`
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

      await checkLatestContent(manager, sourceCardName);
      await manager.insertLinkAt(sourceCardName, targetCardName, linePosition, anchorText);
      // 编辑后移除已获取最新内容标记（源文件和插入目标）
      latestContentFetched.delete(sourceCardName);
      latestContentFetched.delete(targetCardName);
      
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
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 链接插入失败: ${error && error.message ? error.message : String(error)}\n\n💡 **提示**：请检查源记忆片段是否存在，行号位置是否有效。`
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
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 获取反向链接失败: ${error && error.message ? error.message : String(error)}`
        }]
      };
    }
  };
}