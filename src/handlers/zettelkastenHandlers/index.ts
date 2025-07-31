/**
 * Zettelkasten 工具处理器
 * 实现基于记忆片段盒方法的记忆管理工具
 */

import { ZettelkastenManager } from 'modular-mcp-memory/core';
import { ToolDefinition, ToolHandler } from '../../types/index.js';
import createGetContentHandler from './createGetContentHandler.js';
import createSetContentHandler from './createSetContentHandler.js';
import createDeleteContentHandler from './createDeleteContentHandler.js';
import createRenameContentHandler from './createRenameContentHandler.js';
import createGetHintsHandler from './createGetHintsHandler.js';
import createGetSuggestionsHandler from './createGetSuggestionsHandler.js';
import createExtractContentHandler from './createExtractContentHandler.js';
import createInsertLinkAtHandler from './createInsertLinkAtHandler.js';
import createGetBacklinksHandler from './createGetBacklinksHandler.js';


/**
 * 创建工具处理器函数
 */
export function createZettelkastenHandlers(manager: ZettelkastenManager) {
  return {
    getContent: createGetContentHandler(manager),
    setContent: createSetContentHandler(manager),
    deleteContent: createDeleteContentHandler(manager),
    renameContent: createRenameContentHandler(manager),
    getHints: createGetHintsHandler(manager),
    getSuggestions: createGetSuggestionsHandler(manager),
    extractContent: createExtractContentHandler(manager),
    insertLinkAt: createInsertLinkAtHandler(manager),
    getBacklinks: createGetBacklinksHandler(manager),
  };
}