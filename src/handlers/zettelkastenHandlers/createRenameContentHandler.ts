import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolHandler } from '../../types/index.js';
import { latestContentFetched,extractLinkedCardNames, isEmptyPlaceholder } from './utils.js';



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

export default createRenameContentHandler;