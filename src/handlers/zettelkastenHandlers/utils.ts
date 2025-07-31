import { ZettelkastenManager } from 'modular-mcp-memory/core';

// 读取过的文件的全局缓存
export const latestContentFetched: Set<string> = new Set();

// 访问计数器 - 跟踪每个记忆片段的读取次数
export const memoryAccessCounter: Map<string, number> = new Map();

/**
 * 获取环境变量 MEMORY_REPEAT_ACCESS_RESTRICTION 的值
 * 如果未设置则返回默认值 3
 */
export function getMemoryRepeatAccessRestriction(): number {
  const envValue = process.env.MEMORY_REPEAT_ACCESS_RESTRICTION;
  if (envValue === undefined) {
    return 3;
  }
  
  const parsed = parseInt(envValue, 10);
  if (isNaN(parsed) || parsed < 1) {
    return 3;
  }
  
  return parsed;
}

/**
 * 检查是否允许读取某个记忆片段
 * @param fragmentName 记忆片段名称
 * @returns 如果允许读取返回 true，否则返回 false
 */
export function canAccessMemory(fragmentName: string): boolean {
  const maxAccess = getMemoryRepeatAccessRestriction();
  const currentCount = memoryAccessCounter.get(fragmentName) || 0;
  return currentCount < maxAccess;
}

/**
 * 增加记忆片段的读取计数
 * @param fragmentName 记忆片段名称
 */
export function incrementMemoryAccessCounter(fragmentName: string): void {
  const currentCount = memoryAccessCounter.get(fragmentName) || 0;
  memoryAccessCounter.set(fragmentName, currentCount + 1);
}

/**
 * 重置某个记忆片段的读取计数器
 * @param fragmentName 记忆片段名称
 */
export function resetMemoryAccessCounter(fragmentName: string): void {
  memoryAccessCounter.delete(fragmentName);
}

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
export async function checkLatestContent(manager: ZettelkastenManager, fragmentName: string) {
  // 如果文件已经在已获取列表中，则允许编辑
  if (latestContentFetched.has(fragmentName)) {
    return;
  }
  
  // 检查文件是否存在，如果不存在则允许编辑（会自动创建）
  try {
    const content = await manager.getMemory(fragmentName, 0, false);
    // 如果文件存在且不是自动生成的空文件，则需要先获取内容
    if (!isEmptyPlaceholder(manager, content)) {
      throw new Error(`为保证数据安全，编辑前请先使用 getMemory 获取 "${fragmentName}" 的最新内容。`);
    }
  } catch (e: any) {
    // 如果文件不存在（Card not found错误），则允许编辑
    if (e && e.message && e.message.includes('Card not found') || e.message.includes('Fragment not found')) {
      return;
    }
    throw e;
  }
}