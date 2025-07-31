import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolHandler } from '../../types/index.js';
import { latestContentFetched,extractLinkedCardNames, isEmptyPlaceholder } from './utils.js';

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

export default createSetContentHandler;