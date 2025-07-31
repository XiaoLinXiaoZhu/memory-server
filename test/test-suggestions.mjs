#!/usr/bin/env node

/**
 * 测试 getOptimizeSuggestions 函数
 * 验证优化建议功能、阈值计算
 */
import { runTest, sendRequest } from './test-utils.mjs';

async function testGetOptimizeSuggestionsBasic(serverProcess) {
  console.log('🧪 测试 getOptimizeSuggestions 基本功能...');
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "getOptimizeSuggestions",
      arguments: {
        optimizationThreshold: 0.1,
        maxFileCount: 5
      }
    }
  });
  
  if (!response.result || !response.result.suggestions) {
    throw new Error('getOptimizeSuggestions 基本功能失败');
  }
  
  if (!Array.isArray(response.result.suggestions)) {
    throw new Error('getOptimizeSuggestions 返回格式不正确，suggestions 应该是数组');
  }
  
  console.log('✅ getOptimizeSuggestions 基本功能成功');
  return true;
}

async function testGetOptimizeSuggestionsWithFragments(serverProcess) {
  console.log('🧪 测试 getOptimizeSuggestions 带片段...');
  
  // 创建不同类型的片段用于测试
  const fragments = [
    { 
      name: "低价值片段", 
      content: "这是一个低价值记忆片段，内容很长但链接很少，信息散度很低。".repeat(20)
    },
    { 
      name: "孤立片段", 
      content: "这是一个孤立记忆片段，没有其他记忆片段链接到它。"
    },
    { 
      name: "正常片段", 
      content: "这是一个正常记忆片段，它链接了 [[JavaScript]] 和 [[编程语言]]。"
    }
  ];
  
  for (const fragment of fragments) {
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 0,
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
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "getOptimizeSuggestions",
      arguments: {
        optimizationThreshold: 0.01,
        maxFileCount: 5
      }
    }
  });
  
  if (!response.result || !response.result.suggestions) {
    throw new Error('getOptimizeSuggestions 带片段失败');
  }
  
  if (!Array.isArray(response.result.suggestions)) {
    throw new Error('getOptimizeSuggestions 带片段返回格式不正确');
  }
  
  console.log('✅ getOptimizeSuggestions 带片段成功');
  return true;
}

async function testGetOptimizeSuggestionsThreshold(serverProcess) {
  console.log('🧪 测试 getOptimizeSuggestions 阈值控制...');
  
  // 创建一个低价值片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "低价值片段",
        content: "这是一个低价值记忆片段，内容很长但链接很少，信息散度很低。".repeat(20)
      }
    }
  });
  
  // 测试高阈值（应该不返回建议）
  const highThresholdResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "getOptimizeSuggestions",
      arguments: {
        optimizationThreshold: 0.5,
        maxFileCount: 5
      }
    }
  });
  
  if (!highThresholdResponse.result || !highThresholdResponse.result.suggestions) {
    throw new Error('getOptimizeSuggestions 高阈值应该返回空数组');
  }
  
  if (!Array.isArray(highThresholdResponse.result.suggestions) || highThresholdResponse.result.suggestions.length !== 0) {
    throw new Error('getOptimizeSuggestions 高阈值应该返回空数组');
  }
  
  // 测试低阈值（应该返回建议）
  const lowThresholdResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "getOptimizeSuggestions",
      arguments: {
        optimizationThreshold: 0.01,
        maxFileCount: 5
      }
    }
  });
  
  if (!lowThresholdResponse.result || !lowThresholdResponse.result.suggestions) {
    throw new Error('getOptimizeSuggestions 低阈值应该返回建议');
  }
  
  if (!Array.isArray(lowThresholdResponse.result.suggestions) || lowThresholdResponse.result.suggestions.length === 0) {
    throw new Error('getOptimizeSuggestions 低阈值应该返回建议');
  }
  
  console.log('✅ getOptimizeSuggestions 阈值控制成功');
  return true;
}

async function testGetOptimizeSuggestionsMaxFileCount(serverProcess) {
  console.log('🧪 测试 getOptimizeSuggestions 最大文件数量...');
  
  // 创建多个片段
  for (let i = 1; i <= 10; i++) {
    await sendRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 0,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: `片段${i}`,
          content: `这是片段${i}的内容，包含 [[相关片段]] 的引用`
        }
      }
    });
  }
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "getOptimizeSuggestions",
      arguments: {
        optimizationThreshold: 0.01,
        maxFileCount: 3
      }
    }
  });
  
  if (!response.result || !response.result.suggestions) {
    throw new Error('getOptimizeSuggestions 最大文件数量失败');
  }
  
  if (!Array.isArray(response.result.suggestions) || response.result.suggestions.length > 3) {
    throw new Error('getOptimizeSuggestions 最大文件数量应该返回指定数量的建议');
  }
  
  console.log('✅ getOptimizeSuggestions 最大文件数量成功');
  return true;
}

async function testGetOptimizeSuggestionsEmptyDirectory(serverProcess) {
  console.log('🧪 测试 getOptimizeSuggestions 空目录...');
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      name: "getOptimizeSuggestions",
      arguments: {
        optimizationThreshold: 0.1,
        maxFileCount: 5
      }
    }
  });
  
  if (!response.result || !response.result.suggestions) {
    throw new Error('getOptimizeSuggestions 空目录应该返回空数组');
  }
  
  if (!Array.isArray(response.result.suggestions) || response.result.suggestions.length !== 0) {
    throw new Error('getOptimizeSuggestions 空目录应该返回空数组');
  }
  
  console.log('✅ getOptimizeSuggestions 空目录成功');
  return true;
}

async function testGetOptimizeSuggestionsInvalidThreshold(serverProcess) {
  console.log('🧪 测试 getOptimizeSuggestions 无效阈值...');
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 7,
    method: "tools/call",
    params: {
      name: "getOptimizeSuggestions",
      arguments: {
        optimizationThreshold: -1,
        maxFileCount: 5
      }
    }
  });
  
  if (!response.error || !response.error.message.includes("获取优化建议失败")) {
    throw new Error('getOptimizeSuggestions 无效阈值应该返回错误');
  }
  
  console.log('✅ getOptimizeSuggestions 无效阈值正确返回错误');
  return true;
}

async function main() {
  console.log('🧪 开始测试 getOptimizeSuggestions 函数\n');
  
  await runTest('getOptimizeSuggestions基本功能', testGetOptimizeSuggestionsBasic);
  await runTest('getOptimizeSuggestions带片段', testGetOptimizeSuggestionsWithFragments);
  await runTest('getOptimizeSuggestions阈值控制', testGetOptimizeSuggestionsThreshold);
  await runTest('getOptimizeSuggestions最大文件数量', testGetOptimizeSuggestionsMaxFileCount);
  await runTest('getOptimizeSuggestions空目录', testGetOptimizeSuggestionsEmptyDirectory);
  await runTest('getOptimizeSuggestions无效阈值', testGetOptimizeSuggestionsInvalidThreshold);
  
  console.log('\n🎉 getOptimizeSuggestions 函数测试通过！');
}

main().catch(console.error);