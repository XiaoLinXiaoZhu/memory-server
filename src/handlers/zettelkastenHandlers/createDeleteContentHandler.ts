
import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolHandler } from '../../types/index.js';
import { latestContentFetched,extractLinkedCardNames, isEmptyPlaceholder } from './utils.js';

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

export default createDeleteContentHandler;