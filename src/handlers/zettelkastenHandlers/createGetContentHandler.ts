import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolHandler } from '../../types/index.js';
import { latestContentFetched,extractLinkedCardNames, isEmptyPlaceholder } from './utils.js';

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
      }

      // 尝试获取文件内容,如果获取失败，则还是需要获取最新内容
      try {
        content = await manager.getContent(cardName, expandDepth, withLineNumber);
      } catch (e: any) {
        if (e && e.message && e.message.includes('Card not found')) {
          notFound = true;
          // 文件不存在时，标记为已获取（因为不存在内容）
          shouldReturnCached = false;
        }
        throw e;
      }

      // 检查是否为 EMPTY_PLACEHOLDER
      const isPlaceholder = isEmptyPlaceholder(manager, content);
      
      // 如果文件为 EMPTY_PLACEHOLDER，标记为已获取
      if (isPlaceholder) {
        shouldReturnCached = false;
      }

      // 对于已经展开了的内容也要标记为已获取最新内容
      if (expandDepth > 0) {
        const tempContent = await manager.getContent(cardName, expandDepth - 1, withLineNumber);
        // 这样就不包括 未展开的内容了
        if (tempContent && tempContent.length > 0) {
          const expandedCardNames = extractLinkedCardNames(tempContent);
          // 将展开的内容也标记为已获取最新内容
          expandedCardNames.forEach(name => latestContentFetched.add(name));
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
      const MAX_LENGTH = 1024 * 8; // 8KB 限制
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

export default createGetContentHandler;
