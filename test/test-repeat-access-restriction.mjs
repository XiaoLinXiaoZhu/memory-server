#!/usr/bin/env node

/**
 * 测试重复读取限制机制
 * 验证 MEMORY_REPEAT_ACCESS_RESTRICTION 环境变量的功能
 */

import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_STORAGE_DIR = path.join(__dirname, 'test-cards-repeat-restriction');

async function cleanup() {
  if (await fs.pathExists(TEST_STORAGE_DIR)) {
    await fs.remove(TEST_STORAGE_DIR);
  }
}

async function sendRequest(serverProcess, request) {
  return new Promise((resolve, reject) => {
    let responseReceived = false;
    
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        reject(new Error('请求超时'));
      }
    }, 5000);

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

async function startServer(envVars = {}) {
  const env = {
    ...process.env,
    ZETTELKASTEN_STORAGE_DIR: TEST_STORAGE_DIR,
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

async function testRepeatAccessRestriction() {
  console.log('🧪 测试重复读取限制机制...\n');
  
  // 测试1: 默认限制（应该允许重复读取）
  console.log('📋 测试1: 默认限制（无环境变量）');
  await cleanup();
  let serverProcess = await startServer();
  
  try {
    // 创建测试片段
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 1001,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "测试片段",
          content: "测试重复读取限制"
        }
      }
    });
    
    // 第一次读取
    const firstResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 1002,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "测试片段" }
      }
    });
    
    if (firstResponse.error) throw new Error(`第一次读取失败: ${firstResponse.error.message}`);
    console.log('✅ 第一次读取成功');
    
    // 第二次读取（应该成功，因为没有限制）
    const secondResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 1003,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "测试片段" }
      }
    });
    
    if (secondResponse.error) {
      console.log('⚠️  第二次读取被限制（意外）:', secondResponse.error.message);
    } else {
      console.log('✅ 第二次读取成功（符合预期，无限制）');
    }
    
  } finally {
    serverProcess.kill();
  }
  
  // 测试2: 启用严格限制
  console.log('\n📋 测试2: 启用严格限制（MEMORY_REPEAT_ACCESS_RESTRICTION=true）');
  await cleanup();
  serverProcess = await startServer({ MEMORY_REPEAT_ACCESS_RESTRICTION: 'true' });
  
  try {
    // 创建测试片段
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 2001,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "测试片段2",
          content: "测试严格重复读取限制"
        }
      }
    });
    
    // 第一次读取
    const firstResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 2002,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "测试片段2" }
      }
    });
    
    if (firstResponse.error) throw new Error(`第一次读取失败: ${firstResponse.error.message}`);
    console.log('✅ 第一次读取成功');
    
    // 第二次读取（应该被限制）
    const secondResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 2003,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "测试片段2" }
      }
    });
    
    if (secondResponse.error) {
      console.log('✅ 第二次读取被限制（符合预期）:', secondResponse.error.message);
    } else {
      throw new Error('第二次读取应该被限制，但成功了');
    }
    
    // 测试 withLineNumber=true 应该绕过限制
    const thirdResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 2004,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { 
          fragmentName: "测试片段2",
          withLineNumber: true 
        }
      }
    });
    
    if (thirdResponse.error) {
      throw new Error(`withLineNumber=true 应该绕过限制，但失败: ${thirdResponse.error.message}`);
    } else {
      console.log('✅ withLineNumber=true 绕过限制成功');
    }
    
  } finally {
    serverProcess.kill();
  }
  
  // 测试3: 内容更新后应该重置限制
  console.log('\n📋 测试3: 内容更新后重置限制');
  await cleanup();
  serverProcess = await startServer({ MEMORY_REPEAT_ACCESS_RESTRICTION: 'true' });
  
  try {
    // 创建测试片段
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 3001,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "测试片段3",
          content: "初始内容"
        }
      }
    });
    
    // 第一次读取
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 3002,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "测试片段3" }
      }
    });
    console.log('✅ 第一次读取成功');
    
    // 更新内容
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 3003,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "测试片段3",
          content: "更新后的内容"
        }
      }
    });
    console.log('✅ 内容更新成功');
    
    // 再次读取（应该成功，因为内容已更新）
    const afterUpdateResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 3004,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "测试片段3" }
      }
    });
    
    if (afterUpdateResponse.error) {
      throw new Error(`内容更新后读取应该成功，但失败: ${afterUpdateResponse.error.message}`);
    } else {
      console.log('✅ 内容更新后读取成功');
    }
    
  } finally {
    serverProcess.kill();
  }
  
  // 测试4: extractMemory 后应该重置限制
  console.log('\n📋 测试4: extractMemory 后重置限制');
  await cleanup();
  serverProcess = await startServer({ MEMORY_REPEAT_ACCESS_RESTRICTION: 'true' });
  
  try {
    // 创建包含多行内容的片段
    await sendRequest(serverProcess, {
      jsonrpc