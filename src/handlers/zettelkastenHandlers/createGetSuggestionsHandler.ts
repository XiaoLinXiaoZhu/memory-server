import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolHandler } from '../../types/index.js';
import { latestContentFetched,extractLinkedCardNames, isEmptyPlaceholder } from './utils.js';

/**
 * 获取优化建议处理器
 */
function createGetSuggestionsHandler(manager: ZettelkastenManager): ToolHandler {
  return async (args: Record<string, any>) => {
    try {
      const { optimizationThreshold = 0.1, maxFileCount = 10 } = args;
      
      // 获取低价值片段建议
      const lowValueSuggestions = await manager.getLowValueSuggestions(optimizationThreshold, maxFileCount);
      
      // 获取孤立片段建议
      const isolatedSuggestions = await manager.getIsolatedSuggestions(maxFileCount);
      
      let suggestionText = `🔧 **记忆片段优化建议**\n\n`;
      
      // 信息散度和孤立片段说明
      suggestionText += `📊 **信息散度计算原理**\n`;
      suggestionText += `• 信息散度 = 权重 / 字符数\n`;
      suggestionText += `• 权重取决于链接数量：链接越多，串联的上下文越多，信息散度越低\n`;
      suggestionText += `• 字符数越少，信息密度越高，信息散度越低\n`;
      suggestionText += `• 低信息散度表示信息过于集中，可能需要拆分\n\n`;
      
      suggestionText += `🔗 **孤立片段说明**\n`;
      suggestionText += `• 孤立片段是指没有其他记忆片段链接到的片段\n`;
      suggestionText += `• 孤立片段可能需要链接到相关片段、与其他片段合并或删除\n\n`;
      
      suggestionText += `⚠️ **系统片段说明**\n`;
      suggestionText += `• 系统片段（如 bootloader 片段）是只读的，无法修改\n`;
      suggestionText += `• 如果尝试修改系统片段，请在其他可编辑片段中进行相关操作\n\n`;
      
      // 处理低价值片段
      if (lowValueSuggestions.cardNames.length > 0) {
        suggestionText += `📋 **低信息散度记忆片段** (建议拆分)\n`;
        suggestionText += lowValueSuggestions.divergences.map((card: any, index: number) => 
          `${index + 1}. [[${card.cardName}]] (信息散度: ${card.divergence.toFixed(4)}, 权重: ${card.weight.toFixed(2)}, 字符数: ${card.characterCount})`
        ).join('\n');
        
        suggestionText += `\n\n🔍 **优化策略建议**\n`;
        suggestionText += `\n**核心原则：拆分并聚类胜过单纯总结**\n`;
        suggestionText += `• 单纯总结会丢失情绪、环境等重要上下文信息\n`;
        suggestionText += `• 通过 extractContent 工具进行"精确范围拆分"更有效\n\n`;
        
        suggestionText += `**具体操作步骤：**\n`;
        suggestionText += `1. **识别联系紧密的内容块**：在单个记忆片段中找到可以独立成概念的部分\n`;
        suggestionText += `2. **使用 extractContent 精确拆分**：通过行号或正则表达式精确定位内容范围进行提取\n`;
        suggestionText += `3. **建立知识链接**：提取后原位置自动替换为链接，保持知识网络连接\n`;
        suggestionText += `4. **避免多记忆片段对比**：专注单个记忆片段的内部拆分，而非跨记忆片段合并\n\n`;
      }
      
      // 处理孤立片段
      if (isolatedSuggestions.cardNames.length > 0) {
        if (lowValueSuggestions.cardNames.length > 0) {
          suggestionText += `\n\n🔗 **孤立记忆片段** (建议链接或合并)\n`;
        } else {
          suggestionText += `🔗 **孤立记忆片段** (建议链接或合并)\n`;
        }
        
        suggestionText += isolatedSuggestions.isolatedResults
          .filter((result: any) => result.isIsolated)
          .map((result: any, index: number) => 
            `${(lowValueSuggestions.cardNames.length > 0 ? index + lowValueSuggestions.cardNames.length + 1 : index + 1)}. [[${result.cardName}]] (反向链接数: ${result.backlinkCount})`
          ).join('\n');
        
        suggestionText += `\n\n🔗 **孤立片段处理策略**\n`;
        suggestionText += `• **链接到相关片段**：使用 insertLinkAt 在相关记忆片段中添加对此孤立片段的引用\n`;
        suggestionText += `• **合并相关片段**：如果内容相关，考虑使用 renameContent 合并到其他片段\n`;
        suggestionText += `• **删除无用片段**：如果内容不再需要，可使用 deleteContent 删除\n`;
        suggestionText += `• **注意系统片段**：确保不尝试修改系统片段（以 <!-- core memory --> 开头的片段）\n\n`;
      }
      
      // 如果没有需要优化的片段
      if (lowValueSuggestions.cardNames.length === 0 && isolatedSuggestions.cardNames.length === 0) {
        suggestionText += '✨ 所有记忆片段的信息散度都在合理范围内，且没有发现孤立片段！知识结构已经相当优化！\n\n';
      }
      
      suggestionText += `🎯 **维护建议**\n`;
      suggestionText += `• 定期使用 getSuggestions 检查新增内容\n`;
      suggestionText += `• 使用 extractContent 精确拆分长内容\n`;
      suggestionText += `• 使用 insertLinkAt 和 getBacklinks 维护知识网络连接\n`;
      suggestionText += `• 保持知识网络的链接密度\n`;
      suggestionText += `• 注意系统片段的只读特性，避免尝试修改\n\n`;
      
      suggestionText += `💡 **推荐工具使用**\n`;
      suggestionText += `• extractContent：精确范围内容拆分\n`;
      suggestionText += `• insertLinkAt：在相关记忆片段间建立连接\n`;
      suggestionText += `• getBacklinks：了解记忆片段间的引用关系\n`;
      suggestionText += `• getHints：查看高权重记忆片段作为参考模式\n`;
      suggestionText += `• deleteContent：删除不需要的记忆片段\n\n`;
      
      suggestionText += `📝 **提示**：通过拆分低信息散度片段和连接孤立片段，可以构建更强大的知识网络`;
      
      return {
        content: [{
          type: "text" as const,
          text: suggestionText
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ 获取优化建议失败: ${error && error.message ? error.message : String(error)}`
        }]
      };
    }
  };
}

export default createGetSuggestionsHandler;