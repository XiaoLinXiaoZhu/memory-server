#!/usr/bin/env node

/**
 * 测试 deleteMemory 函数
 * 验证删除功能、验证删除
 */
import { runTest, sendRequest } from './test-utils.mjs';

async function testDeleteMemoryBasic(serverProcess) {
  console.log('🧪 测试 deleteMemory 基本功能...');
  
  // 先创建一个片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "待删除片段",
        content: "这个片段将被删除"
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "deleteMemory",
      arguments: {
        fragmentName: "待删除片段"
      }
    }
  });
  
  if (!response.result) {
    throw new Error('deleteMemory 基本功能失败');
  }
  
  console.log('✅ deleteMemory 基本功能成功');
  return true;
}

async function testDeleteMemoryVerify(serverProcess) {
  console.log('🧪 测试 deleteMemory 验证删除...');
  
  // 先创建一个片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "验证删除片段",
        content: "这个片段用于验证删除"
      }
    }
  });
  
  // 删除片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "deleteMemory",
      arguments: {
        fragmentName: "验证删除片段"
      }
    }
  });
  
  // 验证删除
  const getResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: {
        fragmentName: "验证删除片段"
      }
    }
  });
  
  if (!getResponse.error || !getResponse.error.message.includes("获取记忆片段内容失败")) {
    throw new Error('deleteMemory 验证删除失败，片段仍然存在');
  }
  
  console.log('✅ deleteMemory 验证删除成功');
  return true;
}

async function testDeleteMemoryNonExistent(serverProcess) {
  console.log('🧪 测试 deleteMemory 不存在的片段...');
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "deleteMemory",
      arguments: {
        fragmentName: "不存在的片段"
      }
    }
  });
  
  if (!response.error || !response.error.message.includes("删除记忆片段失败")) {
    throw new Error('deleteMemory 不存在的片段应该返回错误');
  }
  
  console.log('✅ deleteMemory 不存在的片段正确返回错误');
  return true;
}

async function testDeleteMemoryWithLinks(serverProcess) {
  console.log('🧪 测试 deleteMemory 带链接的片段...');
  
  // 创建主片段
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
  
  // 创建相关片段
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
  
  // 删除相关片段
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "deleteMemory",
      arguments: {
        fragmentName: "相关片段"
      }
    }
  });
  
  if (!response.result) {
    throw new Error('deleteMemory 带链接的片段失败');
  }
  
  // 验证主片段仍然存在
  const getResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: {
        fragmentName: "主片段"
      }
    }
  });
  
  if (!getResponse.result || !getResponse.result.content) {
    throw new Error('deleteMemory 带链接的片段后，主片段应该仍然存在');
  }
  
  console.log('✅ deleteMemory 带链接的片段成功');
  return true;
}

async function main() {
  console.log('🧪 开始测试 deleteMemory 函数\n');
  
  await runTest('deleteMemory基本功能', testDeleteMemoryBasic);
  await runTest('deleteMemory验证删除', testDeleteMemoryVerify);
  await runTest('deleteMemory不存在的片段', testDeleteMemoryNonExistent);
  await runTest('deleteMemory带链接的片段', testDeleteMemoryWithLinks);
  
  console.log('\n🎉 deleteMemory 函数测试通过！');
}

main().catch(console.error);