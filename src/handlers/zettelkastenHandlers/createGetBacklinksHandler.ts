import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolHandler } from '../../types/index.js';
import { latestContentFetched,extractLinkedCardNames, isEmptyPlaceholder } from './utils.js';


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

export default createGetBacklinksHandler;
