/**
 * 提示处理器 - 为 Zettelkasten 系统提供智能提示模板
 */

import type { ZettelkastenManager } from 'modular-mcp-memory/core';

/**
 * 列出可用的提示模板
 */
export function listPrompts() {
  return {
    prompts: [
      {
        name: "topic_inspiration",
        description: "当不知道聊什么话题时，获取重要卡片作为话题灵感",
        arguments: [
          {
            name: "count",
            description: "获取的话题数量",
            required: false,
            type: "string"
          }
        ]
      },
      {
        name: "chat_optimization",
        description: "聊天结束时，获取系统优化建议，帮助整理和改进知识卡片",
        arguments: [
          {
            name: "threshold",
            description: "优化阈值（默认 0.1）",
            required: false,
            type: "string"
          }
        ]
      }
    ]
  };
}

/**
 * 生成特定的提示内容
 */
export async function generatePrompt(
  zettelkastenManager: ZettelkastenManager,
  promptName: string,
  args: Record<string, any> = {}
) {
  switch (promptName) {
    case "topic_inspiration":
      const count = args.count ? parseInt(args.count, 10) : 8;
      return await generateTopicInspiration(zettelkastenManager, isNaN(count) ? 8 : count);
    
    case "chat_optimization":
      const threshold = args.threshold ? parseFloat(args.threshold) : 0.1;
      return await generateChatOptimization(zettelkastenManager, isNaN(threshold) ? 0.1 : threshold);
    
    default:
      throw new Error(`Unknown prompt: ${promptName}`);
  }
}

/**
 * 生成话题灵感提示
 * 使用 getHints 获取重要卡片作为谈话起点
 */
async function generateTopicInspiration(manager: ZettelkastenManager, count: number) {
  try {
    const hints = await manager.getHints(count);
    
    if (hints.cardNames.length === 0) {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `# 💡 话题灵感

目前您的知识库还是空的。

## 🚀 开始建议：
- 创建第一张卡片记录您感兴趣的概念
- 使用 \`setContent("概念名", "内容")\` 开始构建您的知识网络
- 记住使用 [[链接]] 语法连接相关概念

开始您的知识之旅吧！`
            }
          }
        ]
      };
    }

    // 按权重分组卡片
    const highPriorityCards = hints.cardNames.filter((_, i) => hints.weights[i].weight > 1.5);
    const mediumPriorityCards = hints.cardNames.filter((_, i) => hints.weights[i].weight >= 1.0 && hints.weights[i].weight <= 1.5);
    const normalCards = hints.cardNames.filter((_, i) => hints.weights[i].weight < 1.0);

    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `# 💡 今天聊什么？话题灵感来了！

基于您的知识网络，这里有一些有趣的话题可以探索：

${highPriorityCards.length > 0 ? `## 🔥 核心话题 (高价值概念)
${highPriorityCards.slice(0, 3).map((card, i) => {
  const index = hints.cardNames.indexOf(card);
  return `**${i + 1}. [[${card}]]** 
   权重: ${hints.weights[index].weight.toFixed(2)} | 这是您知识网络中的重要节点`;
}).join('\n\n')}` : ''}

${mediumPriorityCards.length > 0 ? `## ⭐ 深度话题 (值得探索)
${mediumPriorityCards.slice(0, 3).map((card, i) => {
  const index = hints.cardNames.indexOf(card);
  return `**${i + 1}. [[${card}]]** 
   权重: ${hints.weights[index].weight.toFixed(2)} | 可以深入展开的概念`;
}).join('\n\n')}` : ''}

${normalCards.length > 0 ? `## 📚 轻松话题 (随意聊聊)
${normalCards.slice(0, 2).map((card, i) => {
  const index = hints.cardNames.indexOf(card);
  return `**${i + 1}. [[${card}]]** 
   权重: ${hints.weights[index].weight.toFixed(2)} | 轻松的聊天话题`;
}).join('\n\n')}` : ''}

## 💬 对话建议：
- 🎯 **深度探索**：选择一个核心话题，使用 \`getContent("卡片名", 1)\` 展开相关内容
- 🔗 **连接思考**：思考这些概念之间可能的联系
- ✨ **创新思维**：结合不同话题，可能产生新的洞察
- 📝 **记录想法**：对话中的新想法可以创建新卡片

随便选一个开始聊吧！每个话题都可能带来意想不到的收获。`
          }
        }
      ]
    };
  } catch (error) {
    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `无法获取话题灵感: ${error instanceof Error ? error.message : 'Unknown error'}\n\n建议检查知识库是否正确初始化。`
          }
        }
      ]
    };
  }
}

/**
 * 生成聊天优化建议提示
 * 使用 getSuggestions 提供系统维护建议
 */
async function generateChatOptimization(manager: ZettelkastenManager, threshold: number) {
  try {
    const suggestions = await manager.getSuggestions(threshold, 10);
    const hints = await manager.getHints(20); // 获取更多数据用于分析
    
    const totalCards = hints.cardNames.length;
    const avgWeight = hints.weights.length > 0 
      ? hints.weights.reduce((a, b) => a + b.weight, 0) / hints.weights.length 
      : 0;
    
    if (suggestions.cardNames.length === 0 && totalCards > 0) {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `# 🎉 聊天总结与系统状态

## ✨ 系统健康状态：优秀！

📊 **当前统计：**
- 总卡片数：${totalCards}
- 平均权重：${avgWeight.toFixed(3)}
- 系统健康度：🟢 优秀

🏆 **恭喜！** 您的知识库维护得很好：
- ✅ 所有卡片都有良好的价值密度
- ✅ 没有发现低质量内容
- ✅ 知识网络结构合理

## 💡 持续改进建议：
1. **保持连接**：继续在相关概念间建立 [[链接]]
2. **定期回顾**：偶尔重读重要卡片，可能有新的理解
3. **适度拓展**：基于现有知识，探索相关新领域
4. **质量优先**：继续保持每张卡片的原子化和精准性

感谢这次愉快的对话！您的知识网络正在健康成长。🌱`
            }
          }
        ]
      };
    }

    if (suggestions.cardNames.length === 0 && totalCards === 0) {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `# 👋 聊天总结

## 🚀 新的开始

看起来这是您第一次使用 Zettelkasten 系统！

## 📝 接下来可以做的：
1. **记录今天的想法**：将我们聊天中有价值的内容记录为卡片
2. **开始建立基础**：创建一些核心概念卡片
3. **建立连接**：使用 [[链接]] 语法连接相关概念

期待您的知识网络慢慢成长！每一张卡片都是智慧的积累。`
            }
          }
        ]
      };
    }

    // 有优化建议的情况
    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `# 📋 聊天总结与优化建议

## 📊 系统状态概览
- 总卡片数：${totalCards}
- 平均权重：${avgWeight.toFixed(3)}
- 需要优化的卡片：${suggestions.cardNames.length}

## 🔧 发现的优化机会

${suggestions.cardNames.map((cardName, i) => {
  const valueObj = suggestions.values[i];
  const issue = valueObj.value < 0.01 ? "内容过长且引用较少" :
                valueObj.value < 0.05 ? "内容相对冗长" : "引用频率较低";
  const action = valueObj.value < 0.01 ? "考虑拆分为多个小卡片" :
                 valueObj.value < 0.05 ? "精简内容，突出核心" : "增加与其他卡片的连接";
  
  return `### ${i + 1}. [[${cardName}]]
**价值指数**: ${valueObj.value.toFixed(4)}
**主要问题**: ${issue}
**建议行动**: ${action}`;
}).join('\n\n')}

## 🛠️ 优化行动计划

### 立即可做的：
1. **审查内容**：使用 \`getContent("卡片名")\` 查看上述卡片
2. **精简重写**：保留核心概念，去掉冗余信息
3. **拆分大卡片**：一个概念一张卡片的原则

### 长期改进：
1. **增加链接**：在相关卡片间建立 [[连接]]
2. **定期维护**：每段时间运行一次优化检查
3. **质量优先**：创建新卡片时注意保持原子化

## 💭 今日对话收获
感谢这次对话！建议将有价值的讨论内容记录为新卡片，保持知识的持续积累。

🌟 记住：好的知识管理系统需要定期维护，就像花园需要修剪一样。`
          }
        }
      ]
    };
  } catch (error) {
    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `# 聊天总结

无法生成优化建议: ${error instanceof Error ? error.message : 'Unknown error'}

不过感谢这次愉快的对话！记得保存有价值的内容到您的知识库中。`
          }
        }
      ]
    };
  }
}
