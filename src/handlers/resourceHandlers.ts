/**
 * 资源处理器 - 处理 Zettelkasten 卡片资源的列出和读取
 */

import type { ZettelkastenManager } from 'modular-mcp-memory/core';

/**
 * 列出所有 Zettelkasten 卡片作为资源
 */
export async function listZettelkastenResources(zettelkastenManager: ZettelkastenManager) {
  try {
    // 获取所有卡片的提示信息
    const hints = await zettelkastenManager.getHints(50); // 获取最多50个提示
    
    return {
      resources: hints.cardNames.map((cardName: string) => ({
        uri: `memory:///${encodeURIComponent(cardName)}`,
        mimeType: "text/plain",
        name: `卡片: ${cardName}`,
        description: `Zettelkasten 卡片 - ${cardName}。可使用 memory:///${encodeURIComponent(cardName)}#expandDepth 指定展开深度`
      }))
    };
  } catch (error) {
    console.error('列出 Zettelkasten 资源时发生错误:', error);
    return {
      resources: []
    };
  }
}

/**
 * 读取特定 Zettelkasten 卡片的内容
 * 支持通过 URI fragment 指定展开深度，如: memory:///cardName#2
 */
export async function readZettelkastenResource(
  zettelkastenManager: ZettelkastenManager,
  uri: string
) {
  try {
    const url = new URL(uri);
    const cardName = decodeURIComponent(url.pathname.replace(/^\//, ''));
    
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
      throw new Error(`卡片 "${cardName}" 未找到`);
    }

    return {
      contents: [{
        uri: uri,
        mimeType: "text/plain",
        text: `卡片: ${cardName}\n展开深度: ${expandDepth}\n\n${content}`
      }]
    };
  } catch (error) {
    console.error('读取 Zettelkasten 资源时发生错误:', error);
    throw new Error(`无法读取卡片资源: ${error instanceof Error ? error.message : String(error)}`);
  }
}
