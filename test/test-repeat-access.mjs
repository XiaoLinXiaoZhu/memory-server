#!/usr/bin/env node

/**
 * 测试重复读取限制机制
 * 验证限制触发、绕过、重置
 */
import { runTest, sendRequest } from './test-utils.mjs';

async function testRepeatAccessDefaultBehavior(serverProcess) {
  console.log('🧪 测试重复读取限制默认行为（无限制）...');
  
  // 创建测试片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "默认行为测试",
        content: "测试重复读取限制"
      }
    }
  });
  
  // 第一次读取
  const firstResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "默认行为测试" }
    }
  });
  
  if (!firstResponse.result) {
    throw new Error('重复读取限制默认行为失败，第一次读取失败');
  }
  console.log('✅ 第一次读取成功');
  
  // 第二次读取（应该成功，因为没有限制）
  const secondResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "默认行为测试" }
    }
  });
  
  if (!secondResponse.result) {
    throw new Error('重复读取限制默认行为失败，第二次读取应该成功');
  }
  console.log('✅ 第二次读取成功（符合预期，无限制）');
  
  return true;
}

async function testRepeatAccessStrictRestriction(serverProcess) {
  console.log('🧪 测试重复读取限制严格模式...');
  
  // 创建测试片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "严格限制测试",
        content: "测试严格重复读取限制"
      }
    }
  });
  
  // 第一次读取
  const firstResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "严格限制测试" }
    }
  });
  
  if (!firstResponse.result) {
    throw new Error('重复读取限制严格模式失败，第一次读取失败');
  }
  console.log('✅ 第一次读取成功');
  
  // 第二次读取（应该被限制）
  const secondResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "严格限制测试" }
    }
  });
  
  if (!secondResponse.error || !secondResponse.error.message.includes("重复读取限制")) {
    throw new Error('重复读取限制严格模式失败，第二次读取应该被限制');
  }
  console.log('✅ 第二次读取被限制（符合预期）');
  
  return true;
}

async function testRepeatAccessWithLineNumberBypass(serverProcess) {
  console.log('🧪 测试重复读取限制 withLineNumber=true 绕过...');
  
  // 创建测试片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "绕过测试",
        content: "测试重复读取限制绕过"
      }
    }
  });
  
  // 第一次读取
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "绕过测试" }
    }
  });
  
  // 第二次读取（应该被限制）
  const secondResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "绕过测试" }
    }
  });
  
  if (!secondResponse.error || !secondResponse.error.message.includes("重复读取限制")) {
    throw new Error('重复读取限制绕过测试失败，第二次读取应该被限制');
  }
  console.log('✅ 第二次读取被限制');
  
  // 使用 withLineNumber=true 绕过限制
  const bypassResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 7,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { 
        fragmentName: "绕过测试",
        withLineNumber: true 
      }
    }
  });
  
  if (!bypassResponse.result) {
    throw new Error('重复读取限制绕过测试失败，withLineNumber=true 应该绕过限制');
  }
  console.log('✅ withLineNumber=true 成功绕过限制');
  
  return true;
}

async function testRepeatAccessExtractMemoryReset(serverProcess) {
  console.log('🧪 测试重复读取限制 extractMemory 重置...');
  
  // 创建源片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "重置测试",
        content: `第1行：标题
第2行：介绍
第3行：主要内容
第4行：结尾`
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
      arguments: { fragmentName: "重置测试" }
    }
  });
  
  // 第二次读取（应该被限制）
  const secondResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 9,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "重置测试" }
    }
  });
  
  if (!secondResponse.error || !secondResponse.error.message.includes("重复读取限制")) {
    throw new Error('重复读取限制重置测试失败，第二次读取应该被限制');
  }
  console.log('✅ 第二次读取被限制');
  
  // 使用 extractMemory 重置限制
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 10,
    method: "tools/call",
    params: {
      name: "extractMemory",
      arguments: {
        from: "重置测试",
        to: "重置片段",
        range: {
          start: { line: 1 },
          end: { line: 1 }
        }
      }
    }
  });
  console.log('✅ extractMemory 重置限制');
  
  // 再次读取应该成功
  const thirdResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 11,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "重置测试" }
    }
  });
  
  if (!thirdResponse.result) {
    throw new Error('重复读取限制重置测试失败，extractMemory 后应该可以重新读取');
  }
  console.log('✅ extractMemory 后成功重新读取');
  
  return true;
}

async function testRepeatAccessMultipleFragments(serverProcess) {
  console.log('🧪 测试重复读取限制多片段...');
  
  // 创建多个片段
  const fragments = ["片段A", "片段B", "片段C"];
  
  for (const fragment of fragments) {
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 0,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: fragment,
          content: `这是${fragment}的内容`
        }
      }
    });
    
    // 第一次读取
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 0,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: fragment }
      }
    });
    
    // 第二次读取（应该被限制）
    const response = await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 0,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: { fragmentName: fragment }
      }
    });
    
    if (!response.error || !response.error.message.includes("重复读取限制")) {
      throw new Error(`重复读取限制多片段测试失败，${fragment} 第二次读取应该被限制`);
    }
  }
  
  console.log('✅ 多片段重复读取限制测试通过');
  return true;
}

async function main() {
  console.log('🧪 开始测试重复读取限制机制\n');
  
  // 测试默认行为（无限制）
  await runTest('重复读取限制默认行为', testRepeatAccessDefaultBehavior);
  
  // 测试严格限制
  await runTest('重复读取限制严格模式', testRepeatAccessStrictRestriction, { MEMORY_REPEAT_ACCESS_RESTRICTION: 'true' });
  
  // 测试绕过机制
  await runTest('重复读取限制绕过机制', testRepeatAccessWithLineNumberBypass, { MEMORY_REPEAT_ACCESS_RESTRICTION: 'true' });
  
  // 测试重置功能
  await runTest('重复读取限制重置功能', testRepeatAccessExtractMemoryReset, { MEMORY_REPEAT_ACCESS_RESTRICTION: 'true' });
  
  // 测试多片段
  await runTest('重复读取限制多片段', testRepeatAccessMultipleFragments, { MEMORY_REPEAT_ACCESS_RESTRICTION: 'true' });
  
  console.log('\n🎉 重复读取限制机制测试通过！');
}

main().catch(console.error);