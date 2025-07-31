#!/usr/bin/env node

/**
 * 测试 extractMemory 函数
 * 验证内容提取功能、范围选择
 */
import { runTest, sendRequest } from './test-utils.mjs';

async function testExtractMemoryBasic(serverProcess) {
  console.log('🧪 测试 extractMemory 基本功能...');
  
  // 创建包含多行内容的片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
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
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
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
  
  if (!response.result) {
    throw new Error('extractMemory 基本功能失败');
  }
  
  console.log('✅ extractMemory 基本功能成功');
  return true;
}

async function testExtractMemoryVerify(serverProcess) {
  console.log('🧪 测试 extractMemory 验证提取...');
  
  // 创建包含多行内容的片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "验证提取",
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
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "extractMemory",
      arguments: {
        from: "验证提取",
        to: "提取验证",
        range: {
          start: { line: 3 },
          end: { line: 5 }
        }
      }
    }
  });
  
  // 验证提取结果
  const getExtractedResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "提取验证" }
    }
  });
  
  if (!getExtractedResponse.result || !getExtractedResponse.result.content) {
    throw new Error('extractMemory 验证提取失败，无法获取提取的片段');
  }
  
  const extractedContent = getExtractedResponse.result.content[0]?.text || '';
  if (!extractedContent.includes("重要内容A")) {
    throw new Error('extractMemory 验证提取失败，提取内容不正确');
  }
  
  console.log('✅ extractMemory 验证提取成功');
  return true;
}

async function testExtractMemorySingleLine(serverProcess) {
  console.log('🧪 测试 extractMemory 单行提取...');
  
  // 创建包含多行内容的片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "单行提取",
        content: `第1行：标题
第2行：介绍
第3行：主要内容
第4行：结尾`
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "extractMemory",
      arguments: {
        from: "单行提取",
        to: "单行结果",
        range: {
          start: { line: 3 },
          end: { line: 3 }
        }
      }
    }
  });
  
  if (!response.result) {
    throw new Error('extractMemory 单行提取失败');
  }
  
  // 验证提取结果
  const getResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "单行结果" }
    }
  });
  
  if (!getResponse.result || !getResponse.result.content) {
    throw new Error('extractMemory 单行提取验证失败');
  }
  
  const content = getResponse.result.content[0]?.text || '';
  if (!content.includes("主要内容")) {
    throw new Error('extractMemory 单行提取验证失败，内容不正确');
  }
  
  console.log('✅ extractMemory 单行提取成功');
  return true;
}

async function testExtractMemoryNonExistent(serverProcess) {
  console.log('🧪 测试 extractMemory 不存在的源片段...');
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "extractMemory",
      arguments: {
        from: "不存在的片段",
        to: "提取结果",
        range: {
          start: { line: 1 },
          end: { line: 1 }
        }
      }
    }
  });
  
  if (!response.error || !response.error.message.includes("提取记忆片段失败")) {
    throw new Error('extractMemory 不存在的源片段应该返回错误');
  }
  
  console.log('✅ extractMemory 不存在的源片段正确返回错误');
  return true;
}

async function testExtractMemoryInvalidRange(serverProcess) {
  console.log('🧪 测试 extractMemory 无效范围...');
  
  // 创建包含多行内容的片段
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "范围测试",
        content: `第1行：标题
第2行：介绍
第3行：内容`
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      name: "extractMemory",
      arguments: {
        from: "范围测试",
        to: "范围结果",
        range: {
          start: { line: 5 },
          end: { line: 10 }
        }
      }
    }
  });
  
  if (!response.error || !response.error.message.includes("提取记忆片段失败")) {
    throw new Error('extractMemory 无效范围应该返回错误');
  }
  
  console.log('✅ extractMemory 无效范围正确返回错误');
  return true;
}

async function main() {
  console.log('🧪 开始测试 extractMemory 函数\n');
  
  await runTest('extractMemory基本功能', testExtractMemoryBasic);
  await runTest('extractMemory验证提取', testExtractMemoryVerify);
  await runTest('extractMemory单行提取', testExtractMemorySingleLine);
  await runTest('extractMemory不存在的源片段', testExtractMemoryNonExistent);
  await runTest('extractMemory无效范围', testExtractMemoryInvalidRange);
  
  console.log('\n🎉 extractMemory 函数测试通过！');
}

main().catch(console.error);