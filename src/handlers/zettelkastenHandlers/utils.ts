import { ZettelkastenManager } from 'modular-mcp-memory/core';

// 读取过的文件的全局缓存
export const latestContentFetched: Set<string> = new Set();

// 辅助函数：递归提取所有 [[链接]] 文件名
export function extractLinkedCardNames(content: string) {
  const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;
  const result = new Set<string>();
  let match;
  while ((match = LINK_PATTERN.exec(content)) !== null) {
    result.add(match[1].trim());
  }
  return Array.from(result);
}

// 辅助函数：判断 EMPTY_PLACEHOLDER
export function isEmptyPlaceholder(manager: ZettelkastenManager, content: string) {
  return content && content.includes(manager.EMPTY_PLACEHOLDER);
}

/**
 * 编辑操作前校验
 * 可编辑的条件为：1.文件不存在 或者 2.为自动生成的空文件 或者 3. 已经读取过，在读取了的列表内
 */
async function checkLatestContent(manager: ZettelkastenManager, cardName: string) {
  // 如果文件已经在已获取列表中，则允许编辑
  if (latestContentFetched.has(cardName)) {
    return;
  }
  
  // 检查文件是否存在，如果不存在则允许编辑（会自动创建）
  try {
    const content = await manager.getContent(cardName, 0, false);
    // 如果文件存在且不是自动生成的空文件，则需要先获取内容
    if (isEmptyPlaceholder(manager, content)) {
      throw new Error(`为保证数据安全，编辑前请先使用 getContent 获取 "${cardName}" 的最新内容。`);
    }
  } catch (e: any) {
    // 如果文件不存在（Card not found错误），则允许编辑
    if (e && e.message && e.message.includes('Card not found')) {
      return;
    }
    throw e;
  }
}