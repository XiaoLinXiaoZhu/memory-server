import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolHandler } from '../../types/index.js';
import { latestContentFetched,extractLinkedCardNames, isEmptyPlaceholder } from './utils.js';


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

export default createInsertLinkAtHandler;