#!/usr/bin/env node

/**
 * 测试 Zettelkasten Memory Server 的 getSuggestions 方法
 */

import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试用的存储目录
const TEST_STORAGE_DIR = path.join(__dirname, 'test-suggestions-cards');

async function cleanup() {
  if (await fs.pathExists(TEST_STORAGE_DIR)) {
    await fs.remove(TEST_STORAGE_DIR);
  }
}

async function testGetSuggestions() {
  console.log('🧪 开始测试 Zettelkasten Memory Server 的 getSuggestions 方法...\n');

  // 清理之前的测试数据
  await cleanup();

  console.log(`📁 测试存储目录: ${TEST_STORAGE_DIR}\n`);

  // 设置环境变量
  const env = {
    ...process.env,
    ZETTELKASTEN_STORAGE_DIR: TEST_STORAGE_DIR
  };

  // 启动服务器
  const serverProcess = spawn('node', [path.join(__dirname, '..', 'build', 'index.js')], {
    env,
    stdio: ['pipe', 'pipe', 'inherit'],
    cwd: path.join(__dirname, '..')
  });

  console.log('🚀 服务器已启动\n');

  // 模拟 MCP 客户端请求
  const requests = [
    // 1. 列出工具
    {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list"
    },
    // 2. 创建系统片段（只读）
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "bootloader",
          content: "<!-- core memory -->\n# Bootloader\n\n这是系统启动加载器，负责初始化系统。"
        }
      }
    },
    // 3. 创建低价值片段（信息散度低）
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "LowValueCard",
          content: "这是一个低价值记忆片段，内容很长但链接很少，信息散度很低。".repeat(20)
        }
      }
    },
    // 4. 创建孤立片段（没有反向链接）
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "IsolatedCard",
          content: "这是一个孤立记忆片段，没有其他记忆片段链接到它。"
        }
      }
    },
    // 5. 创建正常片段（有链接）
    {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "NormalCard",
          content: "这是一个正常记忆片段，它链接了 [[JavaScript]] 和 [[编程语言]]。"
        }
      }
    },
    // 6. 创建另一个正常片段，链接到孤立片段
    {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "AnotherNormalCard",
          content: "这是另一个正常记忆片段，它链接了 [[IsolatedCard]] 和 [[NormalCard]]。"
        }
      }
    },
    // 7. 获取优化建议（默认参数）
    {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "getOptimizeSuggestions",
        arguments: {}
      }
    },
    // 8. 获取优化建议（自定义参数）
    {
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "getOptimizeSuggestions",
        arguments: {
          optimizationThreshold: 0.01,
          maxFileCount: 5
        }
      }
    },
    // 9. 尝试修改系统片段（应该失败）
    {
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "setMemory",
        arguments: {
          fragmentName: "bootloader",
          content: "这是修改后的系统片段内容。"
        }
      }
    },
    // 10. 获取系统片段内容
    {
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "getMemory",
        arguments: {
          fragmentName: "bootloader"
        }
      }
    },
    // 11. 再次获取优化建议，确认系统片段未被修改
    {
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: {
        name: "getOptimizeSuggestions",
        arguments: {
          optimizationThreshold: 0.01,
          maxFileCount: 5
        }
      }
    }
  ];

  let requestIndex = 0;

  // 发送请求并处理响应
  function sendNextRequest() {
    if (requestIndex >= requests.length) {
      console.log('\n✅ 所有测试完成！正在关闭服务器...\n');
      serverProcess.kill();
      return;
    }

    const request = requests[requestIndex];
    console.log(`📤 发送请求 ${requestIndex + 1}:`, JSON.stringify(request, null, 2));
    
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    requestIndex++;
  }

  // 处理服务器输出
  let buffer = '';
  serverProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    
    // 检查是否有完整的 JSON 响应
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 保留最后一行可能不完整的内容
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          console.log(`📥 收到响应:`, JSON.stringify(response, null, 2));
          console.log('---\n');
          
          // 延迟发送下一个请求
          setTimeout(sendNextRequest, 500);
        } catch (error) {
          console.log(`📄 服务器消息: ${line}`);
        }
      }
    }
  });

  serverProcess.on('close', async (code) => {
    console.log(`🏁 服务器已关闭，退出码: ${code}`);
    
    // 检查生成的文件
    console.log('\n📋 检查生成的记忆片段文件:');
    try {
      if (await fs.pathExists(TEST_STORAGE_DIR)) {
        const files = await fs.readdir(TEST_STORAGE_DIR);
        for (const file of files) {
          if (file.endsWith('.md')) {
            const content = await fs.readFile(path.join(TEST_STORAGE_DIR, file), 'utf-8');
            console.log(`\n📄 ${file}:`);
            console.log(content);
            console.log('---');
          }
        }
      } else {
        console.log('❌ 存储目录未创建');
      }
    } catch (error) {
      console.error('❌ 检查文件时出错:', error);
    }
    
    // 清理测试数据
    await cleanup();
    console.log('\n🧹 测试数据已清理');
  });

  serverProcess.on('error', (error) => {
    console.error('❌ 服务器启动失败:', error);
  });

  // 等待服务器启动后发送第一个请求
  setTimeout(sendNextRequest, 1000);
}

// 运行测试
testGetSuggestions().catch(console.error);