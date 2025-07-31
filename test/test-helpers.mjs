#!/usr/bin/env node

/**
 * 测试辅助函数
 * 用于处理 MCP 响应格式
 */

/**
 * 从 MCP 响应中提取文本内容
 * @param {Object} response - MCP 响应对象
 * @returns {string} 提取的文本内容
 */
export function extractTextContent(response) {
  if (!response || !response.result || !response.result.content) {
    return '';
  }
  
  if (Array.isArray(response.result.content)) {
    return response.result.content.map(item => item.text || '').join('\n');
  }
  
  return response.result.content.text || '';
}

/**
 * 检查响应是否包含错误
 * @param {Object} response - MCP 响应对象
 * @returns {boolean} 是否有错误
 */
export function hasError(response) {
  return !!response.error;
}

/**
 * 获取错误消息
 * @param {Object} response - MCP 响应对象
 * @returns {string} 错误消息
 */
export function getErrorMessage(response) {
  return response.error?.message || '未知错误';
}

/**
 * 检查响应是否成功
 * @param {Object} response - MCP 响应对象
 * @returns {boolean} 是否成功
 */
export function isSuccess(response) {
  return !hasError(response) && response.result;
}