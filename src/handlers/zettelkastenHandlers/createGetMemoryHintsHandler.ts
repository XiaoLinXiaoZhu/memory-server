import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolHandler } from '../../types/index.js';
import { latestContentFetched,extractLinkedCardNames, isEmptyPlaceholder } from './utils.js';

/**
 * 获取提示处理器
 */
function createGetMemoryHintsHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { fileCount = 10 } = args;
      
      const hints = await manager.getMemoryHints(fileCount);
      
      const hintText = hints.fragmentNames && hints.fragmentNames.length > 0 
        ? `🔍 **重要记忆片段提示** (按权重排序)\n\n${hints.fragmentNames.slice(0, fileCount).map((fragment: string, index: number) => `${index + 1}. [[${fragment}]]`).join('\n')}\n\n💡 **提示**：这些高权重记忆片段是知识网络的核心节点。如需优化整体结构，可使用 getOptimizeSuggestions 工具查看低价值记忆片段的优化建议。`
        : '📭 暂无记忆片段\n\n💡 开始创建记忆片段后，可使用 getOptimizeSuggestions 工具获取优化建议。'; 
      
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

export default createGetMemoryHintsHandler;