#!/usr/bin/env node

/**
 * 测试更新后的资源显示
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testResourceDisplay() {
  console.log('🧪 测试更新后的资源显示...\n');

  try {
    // 创建客户端传输
    const transport = new StdioClientTransport({
      command: 'zettelkasten-memory-server',
      args: [],
      env: {
        ZETTELKASTEN_STORAGE_DIR: './test-resource-display'
      }
    });

    // 创建客户端
    const client = new Client({
      name: "test-resource-display-client",
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
        cardName: 'JavaScript基础',
        content: '# JavaScript基础\n\nJavaScript 是一种动态编程语言。\n\n相关概念: [[编程语言]]'
      }
    });

    await client.callTool({
      name: 'setContent',
      arguments: {
        cardName: '编程语言',
        content: '# 编程语言\n\n编程语言是用来编写计算机程序的工具。\n\n包括：[[JavaScript基础]]、[[Python]]'
      }
    });

    await client.callTool({
      name: 'setContent',
      arguments: {
        cardName: '学习笔记',
        content: '# 今日学习\n\n今天学习了 [[JavaScript基础]]，还了解了 [[编程语言]] 的基本概念。'
      }
    });

    console.log('✅ 测试记忆片段创建完成\n');

    // 测试资源列表
    console.log('📚 测试资源列表显示...');
    const resources = await client.listResources();
    console.log(`找到 ${resources.resources.length} 个资源:\n`);

    resources.resources.forEach((resource, index) => {
      console.log(`${index + 1}. **名称**: ${resource.name}`);
      console.log(`   **URI**: ${resource.uri}`);
      console.log(`   **描述**: ${resource.description}`);
      console.log();
    });

    // 测试读取资源（基础格式）
    if (resources.resources.length > 0) {
      const firstResource = resources.resources[0];
      console.log(`📖 测试读取资源: ${firstResource.name}`);
      const content = await client.readResource({ uri: firstResource.uri });
      console.log('内容:');
      console.log(content.contents[0].text);
      console.log();

      // 测试展开格式
      const expandedUri = firstResource.uri + '#1';
      console.log(`🔍 测试展开资源: ${firstResource.name} (深度1)`);
      try {
        const expandedContent = await client.readResource({ uri: expandedUri });
        console.log('展开内容:');
        console.log(expandedContent.contents[0].text);
      } catch (error) {
        console.log('⚠️  展开功能异常:', error.message);
      }
    }

    console.log('\n✅ 资源显示测试完成！');

    // 断开连接
    await client.close();
    console.log('🔌 客户端已断开连接');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testResourceDisplay().catch(console.error);
