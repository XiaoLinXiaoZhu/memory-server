#!/usr/bin/env node

/**
 * 测试重复读取限制机制 - 重置功能
 * 验证内容更新和 extractMemory 操作后限制重置
 */

import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_STORAGE_DIR = path.join(__dirname, 'test-cards-repeat-reset');

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

async function testContentUpdateReset() {
  console.log('🧪 测试内容更新后重置限制...\n');
  
  await cleanup();
  const serverProcess = await startServer({ MEMORY_REPEAT_ACCESS_RESTRICTION: 'true' });
  
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
          content: "初始内容"
        }
      }
    });
    
    // 第一次读取
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "测试片段" }
      }
    });
    console.log('✅ 第一次读取成功');
    
    // 第二次读取（应该被限制）
    const secondResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "测试片段" }
      }
    });
    
    if (!secondResponse.error) {
      throw new Error('第二次读取应该被限制，但成功了');
    }
    
    // 更新内容
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "测试片段",
          content: "更新后的内容"
        }
      }
    });
    console.log('✅ 内容更新成功');
    
    // 再次读取（应该成功，因为内容已更新）
    const afterUpdateResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "测试片段" }
      }
    });
    
    if (afterUpdateResponse.error) {
      throw new Error(`内容更新后读取应该成功，但失败: ${afterUpdateResponse.error.message}`);
    } else {
      console.log('✅ 内容更新后读取成功');
      return true;
    }
    
  } finally {
    serverProcess.kill();
  }
}

async function testExtractMemoryReset() {
  console.log('\n🧪 测试 extractMemory 后重置限制...\n');
  
  await cleanup();
  const serverProcess = await startServer({ MEMORY_REPEAT_ACCESS_RESTRICTION: 'true' });
  
  try {
    // 创建包含多行内容的片段
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "源片段",
          content: `第1行：标题
第2行：介绍
第3行：主要内容开始
第4行：重要内容A
第5行：重要内容B
第6行：结尾`
        }
      }
    });
    
    // 第一次读取
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "源片段" }
      }
    });
    console.log('✅ 第一次读取成功');
    
    // 第二次读取（应该被限制）
    const secondResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "源片段" }
      }
    });
    
    if (!secondResponse.error) {
      throw new Error('第二次读取应该被限制，但成功了');
    }
    
    // 使用 extractMemory 提取内容
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "extractMemory",
        arguments: {
          from: "源片段",
          to: "提取片段",
          range: {
            start: { line: 3 },
            end: { line: 5 }
          }
        }
      }
    });
    console.log('✅ extractMemory 成功');
    
    // 再次读取源片段（应该成功，因为 extractMemory 重置了限制）
    const afterExtractResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "源片段" }
      }
    });
    
    if (afterExtractResponse.error) {
      throw new Error(`extractMemory 后读取应该成功，但失败: ${afterExtractResponse.error.message}`);
    } else {
      console.log('✅ extractMemory 后读取成功');
      return true;
    }
    
  } finally {
    serverProcess.kill();
  }
}

async function testRenameMemoryReset() {
  console.log('\n🧪 测试 renameMemory 后重置限制...\n');
  
  await cleanup();
  const serverProcess = await startServer({ MEMORY_REPEAT_ACCESS_RESTRICTION: 'true' });
  
  try {
    // 创建源片段
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "旧名称",
          content: "这是旧名称的内容"
        }
      }
    });
    
    // 第一次读取
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "旧名称" }
      }
    });
    console.log('✅ 第一次读取成功');
    
    // 第二次读取（应该被限制）
    const secondResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 13,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "旧名称" }
      }
    });
    
    if (!secondResponse.error) {
      throw new Error('第二次读取应该被限制，但成功了');
    }
    
    // 重命名
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 14,
      method: "tools/call",
      params: {
        name: "renameMemory",
        arguments: {
          sourceFragmentName: "旧名称",
          targetFragmentName: "新名称"
        }
      }
    });
    console.log('✅ renameMemory 成功');
    
    // 再次读取旧名称（应该成功，因为 renameMemory 重置了限制）
    const afterRenameResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 15,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "旧名称" }
      }
    });
    
    if (afterRenameResponse.error) {
      throw new Error(`renameMemory 后读取应该成功，但失败: ${afterRenameResponse.error.message}`);
    } else {
      console.log('✅ renameMemory 后读取成功');
      return true;
    }
    
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  console.log('🧪 开始测试重复读取限制机制 - 重置功能\n');
  
  const results = [];
  
  results.push(await testContentUpdateReset());
  results.push(await testExtractMemoryReset());
  results.push(await testRenameMemoryReset());
  
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