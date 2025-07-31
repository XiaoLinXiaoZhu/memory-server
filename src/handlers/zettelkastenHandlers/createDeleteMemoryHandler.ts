import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolHandler } from '../../types/index.js';
import { latestContentFetched,extractLinkedCardNames, isEmptyPlaceholder, checkLatestContent, resetMemoryAccessCounter } from './utils.js';

/**
 * 删除记忆片段内容处理器
 */
function createDeleteMemoryHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { fragmentName } = args;
      
      if (!fragmentName || typeof fragmentName !== 'string') {
        throw new Error('fragmentName is required and must be a string');
      }

      await checkLatestContent(manager, fragmentName);
      await manager.deleteMemory(fragmentName);
      // 编辑后移除已获取最新内容标记
      latestContentFetched.delete(fragmentName);
      // 重置读取计数器
      resetMemoryAccessCounter(fragmentName);
      
      return {
        content: [{
          type: "text" as const,
          text: `🗑️ 记忆片段 "${fragmentName}" 已删除成功`
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

export default createDeleteMemoryHandler;