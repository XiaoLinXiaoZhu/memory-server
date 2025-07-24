#!/usr/bin/env node

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

class McpClient {
  constructor(serverProcess) {
    this.serverProcess = serverProcess;
    this.requestId = 1;
  }

  async callTool(name, args) {
    const request = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: "tools/call",
      params: {
        name,
        arguments: args
      }
    };

    const requestStr = JSON.stringify(request) + '\n';
    this.serverProcess.stdin.write(requestStr);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      const onData = (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            if (response.id === request.id) {
              clearTimeout(timeout);
              this.serverProcess.stdout.removeListener('data', onData);
              
              if (response.error) {
                reject(new Error(response.error.message));
              } else {
                resolve(response.result);
              }
              return;
            }
          } catch (e) {
            // 忽略解析错误，可能是服务器的日志输出
          }
        }
      };

      this.serverProcess.stdout.on('data', onData);
    });
  }

  async close() {
    this.serverProcess.kill();
  }
}

async function createMcpClient() {
  await cleanup();
  
  const serverProcess = spawn('zettelkasten-memory-server', [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ZETTELKASTEN_STORAGE_DIR: TEST_STORAGE_DIR
    }
  });

  const client = new McpClient(serverProcess);

  // 等待服务器启动
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  // 发送初始化请求
  const initRequest = {
    jsonrpc: "2.0",
    id: 0,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  };

  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

  // 等待初始化完成
  await new Promise((resolve) => {
    setTimeout(resolve, 500);
  });

  return client;
}

/**
 * 测试 getSuggestions 增强功能
 */
async function testSuggestions() {
  console.log('🧪 测试 getSuggestions 增强功能...');
  
  const client = await createMcpClient();
  
  try {
    // 创建一些测试卡片
    console.log('\n📝 创建测试卡片...');
    
    // 创建一个长内容的卡片（低价值）
    await client.callTool('setContent', {
      cardName: '长篇笔记',
      content: `# 长篇笔记

这是一个很长的笔记，包含很多内容但缺乏链接。
内容很多，但是价值密度不高。

## 第一部分
这里有很多文字，但是没有太多的链接和引用。
详细的描述了某个概念，但是没有和其他知识点建立联系。

## 第二部分
继续添加更多内容，让这个卡片变得很长。
这样它的价值（权重/字符数）就会比较低。

## 第三部分
更多的内容，更多的文字。
没有引用其他卡片，所以权重很低。

## 第四部分
继续添加内容，让字符数增加但权重保持低水平。
这样就可以在 getSuggestions 中看到优化建议了。

## 总结
这是一个需要拆分的长卡片示例。`
    });
    
    // 创建一个高价值的卡片（短而有链接）
    await client.callTool('setContent', {
      cardName: '核心概念',
      content: `# 核心概念
关键知识点：
- [[JavaScript]]
- [[React]]  
- [[编程语言]]`
    });
    
    console.log('✅ 测试卡片创建完成');
    
    // 测试 getSuggestions
    console.log('\n📊 测试 getSuggestions...');
    
    const suggestions = await client.callTool('getSuggestions', {
      optimizationThreshold: 0.1,
      maxFileCount: 5
    });
    
    console.log('获取优化建议结果:');
    console.log(suggestions.content[0].text);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await client.close();
    await cleanup();
  }
}

// 运行测试
testSuggestions().catch(console.error);
