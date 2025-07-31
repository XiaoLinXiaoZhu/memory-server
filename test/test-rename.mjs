#!/usr/bin/env node

/**
 * 测试 renameMemory 函数
 * 验证重命名功能、引用更新
 */
import { runTest, sendRequest } from './test-utils.mjs';

async function testRenameMemoryBasic(serverProcess) {
  console.log('🧪 测试 renameMemory 基本功能...');
  
  // 先创建源片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "旧名称",
        content: "这是旧名称的内容"
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "renameMemory",
      arguments: {
        sourceFragmentName: "旧名称",
        targetFragmentName: "新名称"
      }
    }
  });
  
  if (!response.result) {
    throw new Error('renameMemory 基本功能失败');
  }
  
  console.log('✅ renameMemory 基本功能成功');
  return true;
}

async function testRenameMemoryVerify(serverProcess) {
  console.log('🧪 测试 renameMemory 验证重命名...');
  
  // 先创建源片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "验证重命名",
        content: "这是验证重命名的内容"
      }
    }
  });
  
  // 重命名
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "renameMemory",
      arguments: {
        sourceFragmentName: "验证重命名",
        targetFragmentName: "已重命名"
      }
    }
  });
  
  // 验证新名称可以获取
  const getNewResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "已重命名" }
    }
  });
  
  if (!getNewResponse.result || !getNewResponse.result.content) {
    throw new Error('renameMemory 验证重命名失败，新名称无法获取');
  }
  
  const newContent = getNewResponse.result.content[0]?.text || '';
  if (!newContent.includes("这是验证重命名的内容")) {
    throw new Error('renameMemory 验证重命名失败，内容不正确');
  }
  
  // 验证旧名称无法获取
  const getOldResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "验证重命名" }
    }
  });
  
  if (!getOldResponse.error || !getOldResponse.error.message.includes("获取记忆片段内容失败")) {
    throw new Error('renameMemory 验证重命名失败，旧名称仍然可以获取');
  }
  
  console.log('✅ renameMemory 验证重命名成功');
  return true;
}

async function testRenameMemoryWithLinks(serverProcess) {
  console.log('🧪 测试 renameMemory 带引用更新...');
  
  // 创建源片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "源片段",
        content: "这是源片段的内容，引用了 [[相关片段]]"
      }
    }
  });
  
  // 创建被引用的片段
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
  
  // 重命名源片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "renameMemory",
      arguments: {
        sourceFragmentName: "源片段",
        targetFragmentName: "重命名片段"
      }
    }
  });
  
  // 验证重命名后的片段内容包含正确的引用
  const getResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "重命名片段" }
    }
  });
  
  if (!getResponse.result || !getResponse.result.content) {
    throw new Error('renameMemory 带引用更新失败');
  }
  
  const content = getResponse.result.content[0]?.text || '';
  if (!content.includes("这是源片段的内容") || !content.includes("相关片段")) {
    throw new Error('renameMemory 带引用更新失败，引用未正确更新');
  }
  
  console.log('✅ renameMemory 带引用更新成功');
  return true;
}

async function testRenameMemoryNonExistent(serverProcess) {
  console.log('🧪 测试 renameMemory 不存在的源片段...');
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "renameMemory",
      arguments: {
        sourceFragmentName: "不存在的片段",
        targetFragmentName: "新名称"
      }
    }
  });
  
  if (!response.error || !response.error.message.includes("重命名记忆片段失败")) {
    throw new Error('renameMemory 不存在的源片段应该返回错误');
  }
  
  console.log('✅ renameMemory 不存在的源片段正确返回错误');
  return true;
}

async function testRenameMemoryDuplicateTarget(serverProcess) {
  console.log('🧪 测试 renameMemory 目标名称重复...');
  
  // 创建两个片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "片段A",
        content: "这是片段A的内容"
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
        fragmentName: "片段B",
        content: "这是片段B的内容"
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "renameMemory",
      arguments: {
        sourceFragmentName: "片段A",
        targetFragmentName: "片段B"
      }
    }
  });
  
  if (!response.error || !response.error.message.includes("重命名记忆片段失败")) {
    throw new Error('renameMemory 目标名称重复应该返回错误');
  }
  
  console.log('✅ renameMemory 目标名称重复正确返回错误');
  return true;
}

async function main() {
  console.log('🧪 开始测试 renameMemory 函数\n');
  
  await runTest('renameMemory基本功能', testRenameMemoryBasic);
  await runTest('renameMemory验证重命名', testRenameMemoryVerify);
  await runTest('renameMemory带引用更新', testRenameMemoryWithLinks);
  await runTest('renameMemory不存在的源片段', testRenameMemoryNonExistent);
  await runTest('renameMemory目标名称重复', testRenameMemoryDuplicateTarget);
  
  console.log('\n🎉 renameMemory 函数测试通过！');
}

main().catch(console.error);