#!/usr/bin/env node

/**
 * 测试 setMemory 函数
 * 验证基本设置功能、内容保存
 */
import { runTest, sendRequest } from './test-utils.mjs';

async function testSetMemoryBasic(serverProcess) {
  console.log('🧪 测试 setMemory 基本功能...');
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "测试片段",
        content: "这是一个测试内容"
      }
    }
  });
  
  if (!response.result) {
    throw new Error('setMemory 基本功能失败');
  }
  
  console.log('✅ setMemory 基本功能成功');
  return true;
}

async function testSetMemoryWithLinks(serverProcess) {
  console.log('🧪 测试 setMemory 带链接内容...');
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "带链接片段",
        content: "这是一个包含 [[相关片段]] 链接的内容"
      }
    }
  });
  
  if (!response.result) {
    throw new Error('setMemory 带链接内容失败');
  }
  
  console.log('✅ setMemory 带链接内容成功');
  return true;
}

async function testSetMemoryLongContent(serverProcess) {
  console.log('🧪 测试 setMemory 长内容...');
  
  const longContent = "这是一个很长的内容，用于测试系统处理长文本的能力。".repeat(50);
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "长内容片段",
        content: longContent
      }
    }
  });
  
  if (!response.result) {
    throw new Error('setMemory 长内容失败');
  }
  
  console.log('✅ setMemory 长内容成功');
  return true;
}

async function testSetMemorySpecialChars(serverProcess) {
  console.log('🧪 测试 setMemory 特殊字符名称...');
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "特殊字符名称@#$%",
        content: "测试特殊字符片段名称"
      }
    }
  });
  
  if (!response.result) {
    throw new Error('setMemory 特殊字符名称失败');
  }
  
  console.log('✅ setMemory 特殊字符名称成功');
  return true;
}

async function testSetMemoryEmptyContent(serverProcess) {
  console.log('🧪 测试 setMemory 空内容...');
  
  const response = await sendRequest(serverProcess, {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "setMemory",
      arguments: {
        fragmentName: "空内容片段",
        content: ""
      }
    }
  });
  
  if (!response.result) {
    throw new Error('setMemory 空内容失败');
  }
  
  console.log('✅ setMemory 空内容成功');
  return true;
}

async function main() {
  console.log('🧪 开始测试 setMemory 函数\n');
  
  await runTest('setMemory基本功能', testSetMemoryBasic);
  await runTest('setMemory带链接内容', testSetMemoryWithLinks);
  await runTest('setMemory长内容', testSetMemoryLongContent);
  await runTest('setMemory特殊字符名称', testSetMemorySpecialChars);
  await runTest('setMemory空内容', testSetMemoryEmptyContent);
  
  console.log('\n🎉 setMemory 函数测试通过！');
}

main().catch(console.error);