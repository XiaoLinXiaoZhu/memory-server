#!/usr/bin/env node

/**
 * 测试重复读取限制机制 - 基本功能
 * 验证默认情况下和启用限制时的行为差异
 */

import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_STORAGE_DIR = path.join(__dirname, 'test-cards-repeat-basic');

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

async function testDefaultBehavior() {
  console.log('🧪 测试默认行为（无限制）...\n');
  
  await cleanup();
  const serverProcess = await startServer();
  
  try {
    // 创建测试片段
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 1,
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
      id: 2,
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
      id: 3,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "测试片段" }
      }
    });
    
    if (secondResponse.error) {
      console.log('⚠️  第二次读取被限制（意外）:', secondResponse.error.message);
      return false;
    } else {
      console.log('✅ 第二次读取成功（符合预期，无限制）');
      return true;
    }
    
  } finally {
    serverProcess.kill();
  }
}

async function testStrictRestriction() {
  console.log('\n🧪 测试严格限制（MEMORY_REPEAT_ACCESS_RESTRICTION=true）...\n');
  
  await cleanup();
  const serverProcess = await startServer({ MEMORY_REPEAT_ACCESS_RESTRICTION: 'true' });
  
  try {
    // 创建测试片段
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 4,
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
      id: 5,
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
      id: 6,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "测试片段2" }
      }
    });
    
    if (secondResponse.error) {
      console.log('✅ 第二次读取被限制（符合预期）:', secondResponse.error.message);
      return true;
    } else {
      throw new Error('第二次读取应该被限制，但成功了');
    }
    
  } finally {
    serverProcess.kill();
  }
}

async function testWithLineNumberBypass() {
  console.log('\n🧪 测试 withLineNumber=true 绕过限制...\n');
  
  await cleanup();
  const serverProcess = await startServer({ MEMORY_REPEAT_ACCESS_RESTRICTION: 'true' });
  
  try {
    // 创建测试片段
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "测试片段3",
          content: "测试 withLineNumber 绕过限制"
        }
      }
    });
    
    // 第一次读取
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "测试片段3" }
      }
    });
    console.log('✅ 第一次读取成功');
    
    // 第二次读取（应该被限制）
    const secondResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "测试片段3" }
      }
    });
    
    if (!secondResponse.error) {
      throw new Error('第二次读取应该被限制，但成功了');
    }
    
    // 测试 withLineNumber=true 应该绕过限制
    const thirdResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { 
          fragmentName: "测试片段3",
          withLineNumber: true 
        }
      }
    });
    
    if (thirdResponse.error) {
      throw new Error(`withLineNumber=true 应该绕过限制，但失败: ${thirdResponse.error.message}`);
    } else {
      console.log('✅ withLineNumber=true 绕过限制成功');
      return true;
    }
    
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  console.log('🧪 开始测试重复读取限制机制 - 基本功能\n');
  
  const results = [];
  
  results.push(await testDefaultBehavior());
  results.push(await testStrictRestriction());
  results.push(await testWithLineNumberBypass());
  
  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 通过: ${results.filter(r => r).length}/${results.length}`);
  console.log(`❌ 失败: ${results.filter(r => !r).length}/${results.length}`);
  
  if (results.every(r => r)) {
    console.log('\n🎉 所有测试通过！');
    process.exit(0);
  } else {
    console.log('\n❌ 部分测试失败！');
    process.exit(1);
  }
}

main().catch(console.error);