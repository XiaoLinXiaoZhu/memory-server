#!/usr/bin/env node

/**
 * 测试优化后的资源显示（只显示一个示范资源）
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testOptimizedResourceDisplay() {
  console.log('🧪 测试优化后的资源显示...\n');

  try {
    // 创建客户端传输
    const transport = new StdioClientTransport({
      command: 'zettelkasten-memory-server',
      args: [],
      env: {
        ZETTELKASTEN_STORAGE_DIR: './test-optimized-resources'
      }
    });

    // 创建客户端
    const client = new Client({
      name: "test-optimized-resources-client",
      version: "1.0.0"
    }, {
      capabilities: {
        resources: {}
      }
    });

    // 连接到服务器
    await client.connect(transport);
    console.log('✅ 客户端已连接\n');

    // 创建一些测试记忆片段
    console.log('📝 创建测试记忆片段...');
    await client.callTool({
      name: 'setContent',
      arguments: {
        cardName: 'JavaScript',
        content: '# JavaScript\n\nJavaScript 是一种动态编程语言。\n\n相关概念: [[编程语言]]'
      }
    });

    await client.callTool({
      name: 'setContent',
      arguments: {
        cardName: '编程语言',
        content: '# 编程语言\n\n编程语言是用来编写计算机程序的工具。\n\n包括：[[JavaScript]]、[[Python]]'
      }
    });

    await client.callTool({
      name: 'setContent',
      arguments: {
        cardName: '学习笔记',
        content: '# 今日学习\n\n今天学习了 [[JavaScript]]，还了解了 [[编程语言]] 的基本概念。'
      }
    });

    console.log('✅ 测试记忆片段创建完成\n');

    // 测试优化后的资源列表（应该只显示一个示范资源）
    console.log('📚 测试优化后的资源列表...');
    const resources = await client.listResources();
    console.log(`找到 ${resources.resources.length} 个资源:\n`);

    resources.resources.forEach((resource, index) => {
      console.log(`${index + 1}. **名称**: ${resource.name}`);
      console.log(`   **URI**: ${resource.uri}`);
      console.log(`   **描述**: ${resource.description}`);
      console.log();
    });

    // 测试访问根路径（应该显示帮助信息）
    console.log('📖 测试访问根路径资源（帮助信息）...');
    const rootContent = await client.readResource({ uri: 'memory:///' });
    console.log('根路径内容:');
    console.log(rootContent.contents[0].text);
    console.log();

    // 测试访问具体记忆片段
    console.log('📖 测试访问具体记忆片段...');
    const jsContent = await client.readResource({ uri: 'memory:///JavaScript' });
    console.log('JavaScript 记忆片段内容:');
    console.log(jsContent.contents[0].text);
    console.log();

    // 测试展开访问
    console.log('🔍 测试展开访问...');
    const expandedContent = await client.readResource({ uri: 'memory:///学习笔记#1' });
    console.log('学习笔记 展开内容:');
    console.log(expandedContent.contents[0].text);
    console.log();

    console.log('✅ 优化后的资源显示测试完成！');

    // 断开连接
    await client.close();
    console.log('🔌 客户端已断开连接');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testOptimizedResourceDisplay().catch(console.error);
