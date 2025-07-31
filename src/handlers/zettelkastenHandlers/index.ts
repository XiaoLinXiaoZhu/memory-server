/**
 * Zettelkasten 工具处理器
 * 实现基于记忆片段盒方法的记忆管理工具
 */

import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolDefinition, ToolHandler } from '../../types/index.js';
import createGetMemoryHandler from './createGetMemoryHandler.js';
import createSetMemoryHandler from './createSetMemoryHandler.js';
import createDeleteMemoryHandler from './createDeleteMemoryHandler.js';
import createRenameMemoryHandler from './createRenameMemoryHandler.js';
import createGetMemoryHintsHandler from './createGetMemoryHintsHandler.js';
import createGetOptimizeSuggestionsHandler from './createGetOptimizeSuggestionsHandler.js';
import createExtractMemoryHandler from './createExtractMemoryHandler.js';
import createInsertLinkAtHandler from './createInsertLinkAtHandler.js';
import createGetBacklinksHandler from './createGetBacklinksHandler.js';

/**
 * 创建工具处理器函数
 */
export function createZettelkastenHandlers(manager: ZettelkastenManager) {
  return {
    getMemory: createGetMemoryHandler(manager),
    setMemory: createSetMemoryHandler(manager),
    deleteMemory: createDeleteMemoryHandler(manager),
    renameMemory: createRenameMemoryHandler(manager),
    getMemoryHints: createGetMemoryHintsHandler(manager),
    getOptimizeSuggestions: createGetOptimizeSuggestionsHandler(manager),
    extractMemory: createExtractMemoryHandler(manager),
    insertLinkAt: createInsertLinkAtHandler(manager),
    getBacklinks: createGetBacklinksHandler(manager),
  };
}