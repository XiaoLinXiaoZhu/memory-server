#!/usr/bin/env node

/**
 * 测试 Zettelkasten Memory Server 的基本功能
 */

import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试用的存储目录
const TEST_STORAGE_DIR = path.join(__dirname, 'test-cards');

async function cleanup() {
  if (await fs.pathExists(TEST_STORAGE_DIR)) {
    await fs.remove(TEST_STORAGE_DIR);
  }
}

async function testServer() {
  console.log('🧪 开始测试 Zettelkasten Memory Server...\n');

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
    // 2. 创建第一张记忆片段
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "setContent",
        arguments: {
          cardName: "JavaScript",
          content: "JavaScript 是一种动态类型的编程语言。\n\n主要特点：\n- 原型继承\n- 事件驱动\n- 弱类型\n\n相关概念：[[编程语言]]、[[Web开发]]"
        }
      }
    },
    // 3. 创建第二张记忆片段
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "setContent",
        arguments: {
          cardName: "编程语言",
          content: "编程语言是用来定义计算机程序的形式化语言。\n\n类型：\n- 编译型：如 [[C语言]]、[[Go]]\n- 解释型：如 [[JavaScript]]、[[Python]]\n- 混合型：如 [[Java]]"
        }
      }
    },
    // 4. 获取记忆片段内容
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "getContent",
        arguments: {
          cardName: "JavaScript",
          expandDepth: 0
        }
      }
    },
    // 5. 获取提示
    {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "getHints",
        arguments: {
          fileCount: 5
        }
      }
    },
    // 6. 获取带行号内容
    {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "getContent",
        arguments: {
          cardName: "JavaScript",
          withLineNumber: true
        }
      }
    },
    // 7. 超长内容截断测试
    {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "setContent",
        arguments: {
          cardName: "LongCard",
          content: "A".repeat(3000)
        }
      }
    },
    {
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "getContent",
        arguments: {
          cardName: "LongCard"
        }
      }
    },
    // 9. 文件保护机制测试（未 getContent 直接 setContent 应报错）
    {
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "setContent",
        arguments: {
          cardName: "ProtectCard",
          content: "test"
        }
      }
    },
    // 10. 先 getContent 再 setContent 应成功
    {
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "setContent",
        arguments: {
          cardName: "ProtectCard",
          content: "test"
        }
      }
    },
    // 11. 重复 getContent 测试
    {
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: {
        name: "getContent",
        arguments: {
          cardName: "JavaScript"
        }
      }
    },
    {
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: {
        name: "getContent",
        arguments: {
          cardName: "JavaScript"
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
testServer().catch(console.error);
