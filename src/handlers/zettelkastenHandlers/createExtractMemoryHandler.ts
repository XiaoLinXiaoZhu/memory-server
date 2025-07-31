import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolHandler } from '../../types/index.js';
import { latestContentFetched,extractLinkedCardNames, isEmptyPlaceholder, checkLatestContent, resetMemoryAccessCounter } from './utils.js';

/**
 * 内容提取处理器 - 支持精确范围定位
 */
function createExtractMemoryHandler(manager: ZettelkastenManager): ToolHandler {
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
        throw new Error(`为保证内容一致性，请先使用 getMemory 获取 "${from}" 的最新内容后再提取。`);
      }
      await manager.extractMemory(from, to, range);
      // 编辑后移除已获取最新内容标记（源文件），并自动标记目标文件为最新内容
      latestContentFetched.delete(from);
      latestContentFetched.add(to);
      // 重置读取计数器
      resetMemoryAccessCounter(from);
      resetMemoryAccessCounter(to);
      
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

export default createExtractMemoryHandler;