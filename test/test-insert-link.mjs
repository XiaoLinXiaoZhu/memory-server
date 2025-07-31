#!/usr/bin/env node

/**
 * 测试 insertLinkAt 函数
 * 验证链接插入功能、位置控制
 */
import { runTest, sendRequest } from './test-utils.mjs';

async function testInsertLinkAtBasic(serverProcess) {
  console.log('🧪 测试 insertLinkAt 基本功能...');
  
  // 创建源文档
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "源文档",
        content: `这是一个文档的开头

这里是一些内容
需要添加链接的地方
结尾部分`
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "insertLinkAt",
      arguments: {
        fragmentName: "源文档",
        link: "[[新链接]]",
        line: 3,
        position: 10
      }
    }
  });
  
  if (!response.result) {
    throw new Error('insertLinkAt 基本功能失败');
  }
  
  console.log('✅ insertLinkAt 基本功能成功');
  return true;
}

async function testInsertLinkAtVerify(serverProcess) {
  console.log('🧪 测试 insertLinkAt 验证插入...');
  
  // 创建源文档
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "验证插入",
        content: `第1行：标题
第2行：介绍
第3行：主要内容
第4行：结尾`
      }
    }
  });
  
  // 在指定位置插入链接
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "insertLinkAt",
      arguments: {
        fragmentName: "验证插入",
        link: "[[相关文档]]",
        line: 3,
        position: 5
      }
    }
  });
  
  // 验证插入结果
  const getResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "验证插入" }
    }
  });
  
  if (!getResponse.result || !getResponse.result.content) {
    throw new Error('insertLinkAt 验证插入失败，无法获取文档内容');
  }
  
  const content = getResponse.result.content[0]?.text || '';
  if (!content.includes("[[相关文档]]")) {
    throw new Error('insertLinkAt 验证插入失败，链接未正确插入');
  }
  
  console.log('✅ insertLinkAt 验证插入成功');
  return true;
}

async function testInsertLinkAtBeginning(serverProcess) {
  console.log('🧪 测试 insertLinkAt 在行首插入...');
  
  // 创建源文档
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "行首插入",
        content: `第1行：原始内容
第2行：更多内容`
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "insertLinkAt",
      arguments: {
        fragmentName: "行首插入",
        link: "[[行首链接]]",
        line: 1,
        position: 0
      }
    }
  });
  
  if (!response.result) {
    throw new Error('insertLinkAt 在行首插入失败');
  }
  
  // 验证插入结果
  const getResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "行首插入" }
    }
  });
  
  if (!getResponse.result || !getResponse.result.content) {
    throw new Error('insertLinkAt 在行首插入验证失败');
  }
  
  const content = getResponse.result.content[0]?.text || '';
  if (!content.startsWith("[[行首链接]]")) {
    throw new Error('insertLinkAt 在行首插入验证失败，链接未正确插入');
  }
  
  console.log('✅ insertLinkAt 在行首插入成功');
  return true;
}

async function testInsertLinkAtEnd(serverProcess) {
  console.log('🧪 测试 insertLinkAt 在行尾插入...');
  
  // 创建源文档
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "行尾插入",
        content: `第1行：原始内容`
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "insertLinkAt",
      arguments: {
        fragmentName: "行尾插入",
        link: "[[行尾链接]]",
        line: 1,
        position: 6
      }
    }
  });
  
  if (!response.result) {
    throw new Error('insertLinkAt 在行尾插入失败');
  }
  
  // 验证插入结果
  const getResponse = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      name: "getMemory",
      arguments: { fragmentName: "行尾插入" }
    }
  });
  
  if (!getResponse.result || !getResponse.result.content) {
    throw new Error('insertLinkAt 在行尾插入验证失败');
  }
  
  const content = getResponse.result.content[0]?.text || '';
  if (!content.endsWith("[[行尾链接]]")) {
    throw new Error('insertLinkAt 在行尾插入验证失败，链接未正确插入');
  }
  
  console.log('✅ insertLinkAt 在行尾插入成功');
  return true;
}

async function testInsertLinkAtNonExistent(serverProcess) {
  console.log('🧪 测试 insertLinkAt 不存在的文档...');
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 7,
    method: "tools/call",
    params: {
      name: "insertLinkAt",
      arguments: {
        fragmentName: "不存在的文档",
        link: "[[新链接]]",
        line: 1,
        position: 0
      }
    }
  });
  
  if (!response.error || !response.error.message.includes("插入链接失败")) {
    throw new Error('insertLinkAt 不存在的文档应该返回错误');
  }
  
  console.log('✅ insertLinkAt 不存在的文档正确返回错误');
  return true;
}

async function testInsertLinkAtInvalidLine(serverProcess) {
  console.log('🧪 测试 insertLinkAt 无效行号...');
  
  // 创建源文档
  await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 0,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "无效行号",
        content: `第1行：内容`
      }
    }
  });
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 8,
    method: "tools/call",
    params: {
      name: "insertLinkAt",
      arguments: {
        fragmentName: "无效行号",
        link: "[[新链接]]",
        line: 5,
        position: 0
      }
    }
  });
  
  if (!response.error || !response.error.message.includes("插入链接失败")) {
    throw new Error('insertLinkAt 无效行号应该返回错误');
  }
  
  console.log('✅ insertLinkAt 无效行号正确返回错误');
  return true;
}

async function main() {
  console.log('🧪 开始测试 insertLinkAt 函数\n');
  
  await runTest('insertLinkAt基本功能', testInsertLinkAtBasic);
  await runTest('insertLinkAt验证插入', testInsertLinkAtVerify);
  await runTest('insertLinkAt在行首插入', testInsertLinkAtBeginning);
  await runTest('insertLinkAt在行尾插入', testInsertLinkAtEnd);
  await runTest('insertLinkAt不存在的文档', testInsertLinkAtNonExistent);
  await runTest('insertLinkAt无效行号', testInsertLinkAtInvalidLine);
  
  console.log('\n🎉 insertLinkAt 函数测试通过！');
}

main().catch(console.error);