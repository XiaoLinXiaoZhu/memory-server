#!/usr/bin/env node

/**
 * 测试 getMemory 函数
 * 验证基本获取功能、内容返回
 */
import { runTest, sendRequest } from './test-utils.mjs';

async function testGetMemoryBasic(serverProcess) {
  console.log('🧪 测试 getMemory 基本功能...');
  
  // 先创建一个片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "测试片段",
        content: "这是一个测试内容"
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: {
        fragmentName: "测试片段"
      }
    }
  });
  
  if (!response.result || !response.result.content) {
    throw new Error('getMemory 基本功能失败');
  }
  
  const content = response.result.content[0]?.text || '';
  if (!content.includes("这是一个测试内容")) {
    throw new Error('getMemory 返回内容不正确');
  }
  
  console.log('✅ getMemory 基本功能成功');
  return true;
}

async function testGetMemoryWithLineNumber(serverProcess) {
  console.log('🧪 测试 getMemory 带行号...');
  
  // 先创建一个片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "多行片段",
        content: "第1行\n第2行\n第3行"
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: {
        fragmentName: "多行片段",
        withLineNumber: true
      }
    }
  });
  
  if (!response.result || !response.result.content) {
    throw new Error('getMemory 带行号失败');
  }
  
  // 验证返回内容包含行号信息
  const content = response.result.content[0]?.text || '';
  if (!content.includes("第1行") || !content.includes("第2行") || !content.includes("第3行")) {
    throw new Error('getMemory 带行号返回内容不正确');
  }
  
  console.log('✅ getMemory 带行号成功');
  return true;
}

async function testGetMemoryNonExistent(serverProcess) {
  console.log('🧪 测试 getMemory 不存在的片段...');
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: {
        fragmentName: "不存在的片段"
      }
    }
  });
  
  if (!response.error || !response.error.message.includes("获取记忆片段内容失败")) {
    throw new Error('getMemory 不存在的片段应该返回错误');
  }
  
  console.log('✅ getMemory 不存在的片段正确返回错误');
  return true;
}

async function testGetMemoryWithExpand(serverProcess) {
  console.log('🧪 测试 getMemory 带扩展...');
  
  // 先创建相关片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "主片段",
        content: "这是主片段，引用了 [[相关片段]]"
      }
    }
  });
  
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "相关片段",
        content: "这是相关片段的内容"
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: {
        fragmentName: "主片段",
        expandDepth: 1
      }
    }
  });
  
  if (!response.result || !response.result.content) {
    throw new Error('getMemory 带扩展失败');
  }
  
  const content = response.result.content[0]?.text || '';
  if (!content.includes("这是主片段") || !content.includes("相关片段")) {
    throw new Error('getMemory 带扩展返回内容不正确');
  }
  
  console.log('✅ getMemory 带扩展成功');
  return true;
}

async function main() {
  console.log('🧪 开始测试 getMemory 函数\n');
  
  await runTest('getMemory基本功能', testGetMemoryBasic);
  await runTest('getMemory带行号', testGetMemoryWithLineNumber);
  await runTest('getMemory不存在的片段', testGetMemoryNonExistent);
  await runTest('getMemory带扩展', testGetMemoryWithExpand);
  
  console.log('\n🎉 getMemory 函数测试通过！');
}

main().catch(console.error);