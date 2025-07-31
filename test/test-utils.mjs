#!/usr/bin/env node

/**
 * 测试工具函数
 * 为所有测试提供统一的工具函数
 */

import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 创建测试存储目录
 * @param {string} testName - 测试名称，用于创建唯一目录
 * @returns {string} 测试存储目录路径
 */
export function createTestDir(testName) {
  return path.join(__dirname, `test-temp-${testName}-${Date.now()}`);
}

/**
 * 清理测试目录
 * @param {string} testDir - 测试目录路径
 */
export async function cleanup(testDir) {
  if (await fs.pathExists(testDir)) {
    await fs.remove(testDir);
  }
}

/**
 * 发送请求到服务器
 * @param {import('child_process').ChildProcess} serverProcess - 服务器进程
 * @param {Object} request - 请求对象
 * @param {number} timeoutMs - 超时时间（毫秒）
 * @returns {Promise<Object>} 响应对象
 */
export async function sendRequest(serverProcess, request, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    let responseReceived = false;
    
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        reject(new Error('请求超时'));
      }
    }, timeoutMs);

    const onData = (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.id === request.id) {
              responseReceived = true;
              clearTimeout(timeout);
              serverProcess.stdout.off('data', onData);
              resolve(response);
            }
          } catch (error) {
            // 忽略非 JSON 行
          }
        }
      }
    };

    serverProcess.stdout.on('data', onData);
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  });
}

/**
 * 启动测试服务器
 * @param {string} testDir - 测试存储目录
 * @param {Object} envVars - 额外的环境变量
 * @returns {Promise<import('child_process').ChildProcess>} 服务器进程
 */
export async function startTestServer(testDir, envVars = {}) {
  const env = {
    ...process.env,
    ZETTELKASTEN_STORAGE_DIR: testDir,
    ...envVars
  };

  const serverProcess = spawn('node', [path.join(__dirname, '..', 'build', 'index.js')], {
    env,
    stdio: ['pipe', 'pipe', 'inherit'],
    cwd: path.join(__dirname, '..')
  });

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return serverProcess;
}

/**
 * 从MCP响应中提取文本内容
 * @param {Object} response - MCP响应对象
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
 * 检查响应是否成功
 * @param {Object} response - MCP响应对象
 * @returns {boolean} 是否成功
 */
export function isSuccess(response) {
  return !response.error && response.result;
}

/**
 * 获取错误消息
 * @param {Object} response - MCP响应对象
 * @returns {string} 错误消息
 */
export function getErrorMessage(response) {
  return response.error?.message || '未知错误';
}

/**
 * 运行测试并自动清理
 * @param {string} testName - 测试名称
 * @param {Function} testFn - 测试函数
 */
export async function runTest(testName, testFn) {
  const testDir = createTestDir(testName);
  
  console.log(`🧪 开始测试: ${testName}`);
  console.log(`📁 测试目录: ${testDir}`);
  
  let serverProcess = null;
  
  try {
    serverProcess = await startTestServer(testDir);
    const result = await testFn(serverProcess, testDir);
    
    console.log(`✅ ${testName} 测试完成`);
    return result;
  } catch (error) {
    console.error(`❌ ${testName} 测试失败:`, error.message);
    throw error;
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
    await cleanup(testDir);
    console.log(`🧹 ${testName} 测试数据已清理`);
  }
}