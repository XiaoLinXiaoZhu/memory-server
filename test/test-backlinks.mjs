#!/usr/bin/env node

/**
 * 测试 getBacklinks 函数
 * 验证反向链接功能、引用查找
 */
import { runTest, sendRequest } from './test-utils.mjs';

async function testGetBacklinksBasic(serverProcess) {
  console.log('🧪 测试 getBacklinks 基本功能...');
  
  // 创建相互引用的片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "主概念",
        content: "这是主概念的内容，引用了 [[相关概念A]] 和 [[相关概念B]]"
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
        fragmentName: "相关概念A",
        content: "这是相关概念A的内容，也引用了 [[主概念]]"
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
        fragmentName: "相关概念B",
        content: "这是相关概念B的内容，引用了 [[主概念]] 和 [[相关概念A]]"
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "getBacklinks",
      arguments: {
        fragmentName: "主概念"
      }
    }
  });
  
  if (!response.result || !response.result.backlinks) {
    throw new Error('getBacklinks 基本功能失败');
  }
  
  if (!Array.isArray(response.result.backlinks)) {
    throw new Error('getBacklinks 返回格式不正确，backlinks 应该是数组');
  }
  
  console.log('✅ getBacklinks 基本功能成功');
  return true;
}

async function testGetBacklinksVerify(serverProcess) {
  console.log('🧪 测试 getBacklinks 验证反向链接...');
  
  // 创建引用关系
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "被引用片段",
        content: "这是被引用片段的内容"
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
        fragmentName: "引用片段1",
        content: "这是引用片段1，引用了 [[被引用片段]]"
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
        fragmentName: "引用片段2",
        content: "这是引用片段2，也引用了 [[被引用片段]]"
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "getBacklinks",
      arguments: {
        fragmentName: "被引用片段"
      }
    }
  });
  
  if (!response.result || !response.result.backlinks) {
    throw new Error('getBacklinks 验证反向链接失败');
  }
  
  const backlinks = response.result.backlinks;
  if (!Array.isArray(backlinks) || backlinks.length !== 2) {
    throw new Error('getBacklinks 验证反向链接应该返回2个反向链接');
  }
  
  // 验证反向链接包含正确的引用片段
  const fragmentNames = backlinks.map(link => link.fragmentName);
  if (!fragmentNames.includes("引用片段1") || !fragmentNames.includes("引用片段2")) {
    throw new Error('getBacklinks 验证反向链接返回的片段名称不正确');
  }
  
  console.log('✅ getBacklinks 验证反向链接成功');
  return true;
}

async function testGetBacklinksNonExistent(serverProcess) {
  console.log('🧪 测试 getBacklinks 不存在的片段...');
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "getBacklinks",
      arguments: {
        fragmentName: "不存在的片段"
      }
    }
  });
  
  if (!response.error || !response.error.message.includes("获取反向链接失败")) {
    throw new Error('getBacklinks 不存在的片段应该返回错误');
  }
  
  console.log('✅ getBacklinks 不存在的片段正确返回错误');
  return true;
}

async function testGetBacklinksIsolatedFragment(serverProcess) {
  console.log('🧪 测试 getBacklinks 孤立片段...');
  
  // 创建一个孤立的片段（没有其他片段引用它）
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "孤立片段",
        content: "这是一个孤立片段，没有其他片段引用它"
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "getBacklinks",
      arguments: {
        fragmentName: "孤立片段"
      }
    }
  });
  
  if (!response.result || !response.result.backlinks) {
    throw new Error('getBacklinks 孤立片段应该返回空数组');
  }
  
  if (!Array.isArray(response.result.backlinks) || response.result.backlinks.length !== 0) {
    throw new Error('getBacklinks 孤立片段应该返回空数组');
  }
  
  console.log('✅ getBacklinks 孤立片段成功');
  return true;
}

async function testGetBacklinksComplexReferences(serverProcess) {
  console.log('🧪 测试 getBacklinks 复杂引用关系...');
  
  // 创建复杂的引用关系
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "核心概念",
        content: "这是核心概念的内容"
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
        fragmentName: "概念A",
        content: "这是概念A，引用了 [[核心概念]] 和 [[概念B]]"
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
        fragmentName: "概念B",
        content: "这是概念B，引用了 [[核心概念]]"
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
        fragmentName: "概念C",
        content: "这是概念C，引用了 [[核心概念]] 和 [[概念A]]"
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "getBacklinks",
      arguments: {
        fragmentName: "核心概念"
      }
    }
  });
  
  if (!response.result || !response.result.backlinks) {
    throw new Error('getBacklinks 复杂引用关系失败');
  }
  
  const backlinks = response.result.backlinks;
  if (!Array.isArray(backlinks) || backlinks.length !== 3) {
    throw new Error('getBacklinks 复杂引用关系应该返回3个反向链接');
  }
  
  // 验证所有引用片段都存在
  const fragmentNames = backlinks.map(link => link.fragmentName);
  const expectedNames = ["概念A", "概念B", "概念C"];
  for (const name of expectedNames) {
    if (!fragmentNames.includes(name)) {
      throw new Error(`getBacklinks 复杂引用关系缺少片段: ${name}`);
    }
  }
  
  console.log('✅ getBacklinks 复杂引用关系成功');
  return true;
}

async function main() {
  console.log('🧪 开始测试 getBacklinks 函数\n');
  
  await runTest('getBacklinks基本功能', testGetBacklinksBasic);
  await runTest('getBacklinks验证反向链接', testGetBacklinksVerify);
  await runTest('getBacklinks不存在的片段', testGetBacklinksNonExistent);
  await runTest('getBacklinks孤立片段', testGetBacklinksIsolatedFragment);
  await runTest('getBacklinks复杂引用关系', testGetBacklinksComplexReferences);
  
  console.log('\n🎉 getBacklinks 函数测试通过！');
}

main().catch(console.error);