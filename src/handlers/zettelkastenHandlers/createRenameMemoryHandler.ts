import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolHandler } from '../../types/index.js';
import { latestContentFetched,extractLinkedCardNames, isEmptyPlaceholder, checkLatestContent, resetMemoryAccessCounter } from './utils.js';

/**
 * 重命名记忆片段内容处理器
 */
function createRenameMemoryHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { sourceFragmentName, targetFragmentName } = args;
      
      if (!sourceFragmentName || typeof sourceFragmentName !== 'string') {
        throw new Error('sourceFragmentName is required and must be a string');
      }
      
      if (!targetFragmentName || typeof targetFragmentName !== 'string') {
        throw new Error('targetFragmentName is required and must be a string');
      }

      await checkLatestContent(manager, sourceFragmentName);
      await manager.renameMemory(sourceFragmentName, targetFragmentName);
      // 编辑后移除已获取最新内容标记（旧文件和重命名目标）
      latestContentFetched.delete(sourceFragmentName);
      latestContentFetched.delete(targetFragmentName);
      // 重置读取计数器
      resetMemoryAccessCounter(sourceFragmentName);
      resetMemoryAccessCounter(targetFragmentName);
      
      return {
        content: [{
          type: "text" as const,
          text: `✅ 记忆片段 "${sourceFragmentName}" 已重命名为 "${targetFragmentName}"\n\n💡 **提示**：重构完成后，可使用 getOptimizeSuggestions 工具检查是否需要进一步优化。`
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

export default createRenameMemoryHandler;