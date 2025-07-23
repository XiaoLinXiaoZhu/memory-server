#!/usr/bin/env node

/**
 * 测试 Zettelkasten Memory Server 的完整功能
 * 包括工具、资源和提示功能
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testCompleteFeatures() {
  console.log('🧪 测试 Zettelkasten Memory Server 完整功能...\n');

  try {
    // 创建客户端传输
    const transport = new StdioClientTransport({
      command: 'zettelkasten-memory-server',
      args: [],
      env: {
        ZETTELKASTEN_STORAGE_DIR: './test-complete-cards'
      }
    });

    // 创建客户端
    const client = new Client({
      name: "test-complete-client",
      version: "1.0.0"
    }, {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      }
    });

    // 连接到服务器
    await client.connect(transport);
    console.log('✅ 客户端已连接\n');

    // 首先创建一些测试卡片
    console.log('📝 创建测试卡片...');
    await client.callTool({
      name: 'setContent',
      arguments: {
        cardName: 'JavaScript',
        content: '# JavaScript\n\nJavaScript 是一种编程语言，具有以下特点：\n- 动态类型\n- 原型继承\n- 事件驱动\n\n相关概念: [[编程语言]]、[[Web开发]]'
      }
    });

    await client.callTool({
      name: 'setContent',
      arguments: {
        cardName: 'React',
        content: '# React\n\n今天学习了 React，它是基于 [[JavaScript]] 的前端框架。\n\nReact 的核心概念包括：\n- [[组件化]]\n- [[状态管理]]\n- [[虚拟DOM]]'
      }
    });

    await client.callTool({
      name: 'setContent',
      arguments: {
        cardName: '编程语言',
        content: '# 编程语言\n\n编程语言是用来编写计算机程序的工具。常见的编程语言包括：\n- [[JavaScript]]\n- [[Python]]\n- [[Java]]'
      }
    });

    await client.callTool({
      name: 'setContent',
      arguments: {
        cardName: 'Web开发',
        content: '# Web开发\n\nWeb开发涉及创建网站和网络应用。主要技术：\n- 前端：[[JavaScript]]、[[React]]、CSS\n- 后端：Node.js、[[Python]]\n- 数据库：MySQL、MongoDB'
      }
    });

    console.log('✅ 测试卡片创建完成\n');

    // 测试工具列表
    console.log('🔧 测试工具功能...');
    const tools = await client.listTools();
    console.log(`找到 ${tools.tools.length} 个工具:`);
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // 测试资源列表
    console.log('📚 测试资源功能...');
    const resources = await client.listResources();
    console.log(`找到 ${resources.resources.length} 个资源:`);
    resources.resources.forEach(resource => {
      console.log(`  - ${resource.uri}`);
      console.log(`    名称: ${resource.name}`);
      console.log(`    描述: ${resource.description}`);
      console.log();
    });

    // 测试读取资源
    if (resources.resources.length > 0) {
      console.log('📖 测试读取资源...');
      const firstResource = resources.resources[0];
      const resourceContent = await client.readResource({ uri: firstResource.uri });
      console.log(`资源内容 (${firstResource.uri}):`);
      console.log(resourceContent.contents[0].text);
      console.log();

      // 测试带展开深度的资源读取
      const expandedUri = firstResource.uri + '#1';
      console.log(`📖 测试展开资源 (${expandedUri})...`);
      try {
        const expandedContent = await client.readResource({ uri: expandedUri });
        console.log('展开的资源内容:');
        console.log(expandedContent.contents[0].text);
        console.log();
      } catch (error) {
        console.log('⚠️  展开功能可能不支持:', error.message);
        console.log();
      }
    }

    // 测试提示功能
    console.log('💡 测试提示功能...');
    const prompts = await client.listPrompts();
    console.log(`找到 ${prompts.prompts.length} 个提示模板:`);
    prompts.prompts.forEach(prompt => {
      console.log(`  - ${prompt.name}: ${prompt.description}`);
      if (prompt.arguments && prompt.arguments.length > 0) {
        console.log(`    参数:`);
        prompt.arguments.forEach(arg => {
          console.log(`      - ${arg.name}: ${arg.description} (必需: ${arg.required})`);
        });
      }
      console.log();
    });

    // 测试获取提示内容
    if (prompts.prompts.length > 0) {
      console.log('🎯 测试获取提示内容...');
      
      // 测试话题灵感提示
      try {
        const topicPrompt = await client.getPrompt({
          name: 'topic_inspiration',
          arguments: { count: 3 }
        });
        console.log('话题灵感提示:');
        console.log(topicPrompt.messages[0].content.text);
        console.log();
      } catch (error) {
        console.log('⚠️  获取话题灵感提示失败:', error.message);
      }

      // 测试聊天优化提示
      try {
        const chatPrompt = await client.getPrompt({
          name: 'chat_optimization',
          arguments: { threshold: 0.1 }
        });
        console.log('聊天优化提示:');
        console.log(chatPrompt.messages[0].content.text);
        console.log();
      } catch (error) {
        console.log('⚠️  获取聊天优化提示失败:', error.message);
      }
    }

    console.log('✅ 完整功能测试完成！');

    // 断开连接
    await client.close();
    console.log('🔌 客户端已断开连接');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testCompleteFeatures().catch(console.error);
