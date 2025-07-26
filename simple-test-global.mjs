#!/usr/bin/env node

/**
 * 简单测试 Zettelkasten Memory Server 的基本功能
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testZettelkastenServer() {
  console.log('🧪 开始测试 Zettelkasten Memory Server...\n');

  try {
    // 创建客户端传输
    const transport = new StdioClientTransport({
      command: 'zettelkasten-memory-server',
      args: [],
      env: {
        ZETTELKASTEN_STORAGE_DIR: './test-cards'
      }
    });

    // 创建客户端
    const client = new Client({
      name: "test-client",
      version: "1.0.0"
    }, {
      capabilities: {}
    });

    // 连接到服务器
    await client.connect(transport);
    console.log('✅ 客户端已连接\n');

    // 测试1: 列出工具
    console.log('📋 测试1: 列出可用工具');
    const tools = await client.listTools();
    console.log(`找到 ${tools.tools.length} 个工具:`);
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // 测试2: 创建记忆片段
    console.log('📝 测试2: 创建记忆片段');
    await client.callTool({
      name: 'setContent',
      arguments: {
        cardName: 'JavaScript',
        content: '# JavaScript\n\nJavaScript 是一种编程语言，具有以下特点：\n- 动态类型\n- 原型继承\n- 事件驱动\n\n相关概念: [[编程语言]]、[[Web开发]]'
      }
    });
    console.log('✅ 创建记忆片段: JavaScript');

    await client.callTool({
      name: 'setContent',
      arguments: {
        cardName: 'React',
        content: '# React\n\n今天学习了 React，它是基于 [[JavaScript]] 的前端框架。\n\nReact 的核心概念包括：\n- [[组件化]]\n- [[状态管理]]\n- [[虚拟DOM]]'
      }
    });
    console.log('✅ 创建记忆片段: React');

    await client.callTool({
      name: 'setContent',
      arguments: {
        cardName: '编程语言',
        content: '# 编程语言\n\n编程语言是用来编写计算机程序的工具。常见的编程语言包括：\n- [[JavaScript]]\n- [[Python]]\n- [[Java]]'
      }
    });
    console.log('✅ 创建记忆片段: 编程语言\n');

    // 测试3: 获取记忆片段内容
    console.log('📖 测试3: 获取记忆片段内容');
    const jsContent = await client.callTool({
      name: 'getContent',
      arguments: {
        cardName: 'JavaScript'
      }
    });
    console.log('JavaScript 记忆片段内容:');
    console.log(jsContent.content[0].text);
    console.log();

    // 测试4: 获取展开内容
    console.log('🔍 测试4: 获取展开内容');
    const expandedContent = await client.callTool({
      name: 'getContent',
      arguments: {
        cardName: 'React',
        expandDepth: 1
      }
    });
    console.log('React 记忆片段展开内容:');
    console.log(expandedContent.content[0].text);
    console.log();

    // 测试5: 获取提示
    console.log('💡 测试5: 获取重要记忆片段提示');
    const hints = await client.callTool({
      name: 'getHints',
      arguments: {
        fileCount: 5
      }
    });
    console.log('重要记忆片段提示:');
    console.log(hints.content[0].text);
    console.log();

    // 测试6: 列出资源
    console.log('📚 测试6: 列出资源');
    const resources = await client.listResources();
    console.log(`找到 ${resources.resources.length} 个资源:`);
    resources.resources.forEach(resource => {
      console.log(`  - ${resource.uri}: ${resource.name}`);
    });
    console.log();

    console.log('✅ 所有测试完成！');

    // 断开连接
    await client.close();
    console.log('🔌 客户端已断开连接');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testZettelkastenServer().catch(console.error);
