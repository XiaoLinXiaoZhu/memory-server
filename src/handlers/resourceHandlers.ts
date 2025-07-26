/**
 * 资源处理器 - 处理 Zettelkasten 记忆片段资源的列出和读取
 */

import type { ZettelkastenManager } from 'modular-mcp-memory/core';

/**
 * 列出所有 Zettelkasten 记忆片段作为资源
 */
export async function listZettelkastenResources(zettelkastenManager: ZettelkastenManager) {
  try {
    // 只返回一个示范资源，说明如何使用 memory:// 协议访问任意记忆片段
    return {
      resources: [
        {
          uri: "memory:///",
          mimeType: "text/plain",
          name: "Zettelkasten 记忆片段访问",
          description: "使用 memory:///记忆片段名 访问任意记忆片段，可添加 #depth 指定展开深度（如 memory:///JavaScript#1）"
        }
      ]
    };
  } catch (error) {
    console.error('列出 Zettelkasten 资源时发生错误:', error);
    return {
      resources: []
    };
  }
}

/**
 * 读取特定 Zettelkasten 记忆片段的内容
 * 支持通过 URI fragment 指定展开深度，如: memory:///cardName#2
 */
export async function readZettelkastenResource(
  zettelkastenManager: ZettelkastenManager,
  uri: string
) {
  try {
    const url = new URL(uri);
    const cardName = decodeURIComponent(url.pathname.replace(/^\//, ''));
    
    // 如果是根路径，提供使用帮助
    if (!cardName) {
      const hints = await zettelkastenManager.getHints(10);
      const exampleCards = hints.cardNames.slice(0, 3);
      
      return {
        contents: [{
          uri: uri,
          mimeType: "text/plain",
          text: `# 📚 Zettelkasten 记忆片段访问指南

## 🎯 如何访问记忆片段

使用以下格式访问任意记忆片段：
- \`memory:///记忆片段名\` - 获取记忆片段基础内容
- \`memory:///记忆片段名#1\` - 展开一层引用
- \`memory:///记忆片段名#2\` - 展开两层引用

## 📝 当前可用记忆片段${exampleCards.length > 0 ? '（示例）' : ''}
${exampleCards.length > 0 ? 
exampleCards.map(name => `- \`memory:///${encodeURIComponent(name)}\` → ${name}`).join('\n') :
'目前还没有记忆片段，请使用 setContent 工具创建第一张记忆片段'}

## 💡 提示
- 可以访问任何存在的记忆片段，即使它不在上述示例中
- 使用 getHints 工具查看所有可用记忆片段
- 记忆片段名支持中文和特殊字符`
        }]
      };
    }
    
    // 从 fragment 中获取展开深度，默认为 0
    let expandDepth = 0;
    if (url.hash) {
      const hashValue = url.hash.substring(1); // 移除 # 字符
      const parsedDepth = parseInt(hashValue, 10);
      if (!isNaN(parsedDepth) && parsedDepth >= 0) {
        expandDepth = parsedDepth;
      }
    }
    
    // 调用 getContent 方法，等效于 GetFileContent(cardName, expandDepth)
    const content = await zettelkastenManager.getContent(cardName, expandDepth);
    
    if (!content) {
      throw new Error(`记忆片段 "${cardName}" 未找到`);
    }

    return {
      contents: [{
        uri: uri,
        mimeType: "text/plain",
        text: expandDepth > 0 ? `📄 **${cardName}** (展开深度: ${expandDepth})\n\n${content}` : `📄 **${cardName}**\n\n${content}`
      }]
    };
  } catch (error) {
    console.error('读取 Zettelkasten 资源时发生错误:', error);
    throw new Error(`无法读取记忆片段资源: ${error instanceof Error ? error.message : String(error)}`);
  }
}
