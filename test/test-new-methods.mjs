#!/usr/bin/env node

/**
 * 测试新的方法名
 * 验证 getMemory, setMemory, deleteMemory, renameMemory, extractMemory, getOptimizeSuggestions, getMemoryHints 等方法
 */

import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_STORAGE_DIR = path.join(__dirname, 'test-cards-new-methods');

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

async function testSetAndGetMemory() {
  console.log('🧪 测试 setMemory 和 getMemory...\n');
  
  await cleanup();
  const serverProcess = await startServer();
  
  try {
    // 测试 setMemory
    const setResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "测试片段",
          content: "这是一个测试内容，包含 [[相关片段]] 的引用"
        }
      }
    });
    
    if (setResponse.error) throw new Error(`setMemory 失败: ${setResponse.error.message}`);
    console.log('✅ setMemory 成功');
    
    // 测试 getMemory
    const getResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: {
          fragmentName: "测试片段"
        }
      }
    });
    
    if (getResponse.error) throw new Error(`getMemory 失败: ${getResponse.error.message}`);
    if (!getResponse.result.content.includes("这是一个测试内容")) {
      throw new Error("getMemory 返回内容不正确");
    }
    console.log('✅ getMemory 成功');
    
    return true;
    
  } finally {
    serverProcess.kill();
  }
}

async function testDeleteMemory() {
  console.log('\n🧪 测试 deleteMemory...\n');
  
  await cleanup();
  const serverProcess = await startServer();
  
  try {
    // 创建测试片段
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "待删除片段",
          content: "这个片段将被删除"
        }
      }
    });
    
    // 删除片段
    const deleteResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "deleteMemory",
        arguments: {
          fragmentName: "待删除片段"
        }
      }
    });
    
    if (deleteResponse.error) throw new Error(`deleteMemory 失败: ${deleteResponse.error.message}`);
    console.log('✅ deleteMemory 成功');
    
    // 验证删除
    const verifyDeleteResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: {
          fragmentName: "待删除片段"
        }
      }
    });
    
    if (!verifyDeleteResponse.error) {
      throw new Error("deleteMemory 后仍能获取到内容");
    }
    console.log('✅ deleteMemory 验证成功');
    
    return true;
    
  } finally {
    serverProcess.kill();
  }
}

async function testRenameMemory() {
  console.log('\n🧪 测试 renameMemory...\n');
  
  await cleanup();
  const serverProcess = await startServer();
  
  try {
    // 创建源片段
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "旧名称",
          content: "这是旧名称的内容，引用 [[其他片段]]"
        }
      }
    });
    
    // 创建被引用的片段
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "其他片段",
          content: "这是其他片段的内容"
        }
      }
    });
    
    // 重命名
    const renameResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "renameMemory",
        arguments: {
          sourceFragmentName: "旧名称",
          targetFragmentName: "新名称"
        }
      }
    });
    
    if (renameResponse.error) throw new Error(`renameMemory 失败: ${renameResponse.error.message}`);
    console.log('✅ renameMemory 成功');
    
    // 验证重命名
    const getNewResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "新名称" }
      }
    });
    
    if (getNewResponse.error) throw new Error("重命名后无法获取新名称内容");
    console.log('✅ renameMemory 验证成功');
    
    return true;
    
  } finally {
    serverProcess.kill();
  }
}

async function testExtractMemory() {
  console.log('\n🧪 测试 extractMemory...\n');
  
  await cleanup();
  const serverProcess = await startServer();
  
  try {
    // 创建包含多行内容的片段
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 10,
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
    
    // 提取部分内容
    const extractResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 11,
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
    
    if (extractResponse.error) throw new Error(`extractMemory 失败: ${extractResponse.error.message}`);
    console.log('✅ extractMemory 成功');
    
    // 验证提取结果
    const getExtractedResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: "提取片段" }
      }
    });
    
    if (getExtractedResponse.error) throw new Error("无法获取提取的片段");
    if (!getExtractedResponse.result.content.includes("重要内容A")) {
      throw new Error("提取内容不正确");
    }
    console.log('✅ extractMemory 验证成功');
    
    return true;
    
  } finally {
    serverProcess.kill();
  }
}

async function testGetMemoryHints() {
  console.log('\n🧪 测试 getMemoryHints...\n');
  
  await cleanup();
  const serverProcess = await startServer();
  
  try {
    // 创建多个片段用于测试
    const fragments = [
      { name: "重要片段1", content: "这是非常重要的内容" },
      { name: "普通片段", content: "这是普通内容" },
      { name: "重要片段2", content: "这也是非常重要的内容" }
    ];
    
    for (const fragment of fragments) {
      await sendRequest(serverProcess, {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: "setMemory",
          arguments: {
            fragmentName: fragment.name,
            content: fragment.content
          }
        }
      });
    }
    
    // 获取提示
    const hintsResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 13,
      method: "tools/call",
      params: {
        name: "getMemoryHints",
        arguments: {
          fileCount: 5
        }
      }
    });
    
    if (hintsResponse.error) throw new Error(`getMemoryHints 失败: ${hintsResponse.error.message}`);
    if (!hintsResponse.result || !Array.isArray(hintsResponse.result.hints)) {
      throw new Error("getMemoryHints 返回格式不正确");
    }
    console.log('✅ getMemoryHints 成功');
    
    return true;
    
  } finally {
    serverProcess.kill();
  }
}

async function testGetOptimizeSuggestions() {
  console.log('\n🧪 测试 getOptimizeSuggestions...\n');
  
  await cleanup();
  const serverProcess = await startServer();
  
  try {
    // 创建多个片段用于测试优化建议
    const fragments = [
      { name: "短片段1", content: "很短" },
      { name: "短片段2", content: "也很短" },
      { name: "长片段", content: "这是一个很长的片段，包含了很多内容，应该有足够的信息量来避免被标记为需要优化。这个片段包含了多个段落和详细的信息描述。" }
    ];
    
    for (const fragment of fragments) {
      await sendRequest(serverProcess, {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: "setMemory",
          arguments: {
            fragmentName: fragment.name,
            content: fragment.content
          }
        }
      });
    }
    
    // 获取优化建议
    const suggestionsResponse = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 14,
      method: "tools/call",
      params: {
        name: "getOptimizeSuggestions",
        arguments: {
          optimizationThreshold: 0.1,
          maxFileCount: 10
        }
      }
    });
    
    if (suggestionsResponse.error) throw new Error(`getOptimizeSuggestions 失败: ${suggestionsResponse.error.message}`);
    if (!suggestionsResponse.result) {
      throw new Error("getOptimizeSuggestions 返回格式不正确");
    }
    console.log('✅ getOptimizeSuggestions 成功');
    
    return true;
    
  } finally {
    serverProcess.kill();
  }
}

async function main() {
  console.log('🧪 开始测试新的方法名\n');
  
  const results = [];
  
  results.push(await testSetAndGetMemory());
  results.push(await testDeleteMemory());
  results.push(await testRenameMemory());
  results.push(await testExtractMemory());
  results.push(await testGetMemoryHints());
  results.push(await testGetOptimizeSuggestions());
  
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