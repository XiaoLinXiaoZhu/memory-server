#!/usr/bin/env node

/**
 * 测试修复后的提示功能
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testPromptFeatures() {
  console.log('🧪 测试修复后的提示功能...\n');

  try {
    // 创建客户端传输
    const transport = new StdioClientTransport({
      command: 'zettelkasten-memory-server',
      args: [],
      env: {
        ZETTELKASTEN_STORAGE_DIR: './test-prompt-cards'
      }
    });

    // 创建客户端
    const client = new Client({
      name: "test-prompt-client",
      version: "1.0.0"
    }, {
      capabilities: {
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

    console.log('✅ 测试卡片创建完成\n');

    // 测试提示功能
    console.log('💡 测试提示功能...');
    const prompts = await client.listPrompts();
    console.log(`找到 ${prompts.prompts.length} 个提示模板:`);
    prompts.prompts.forEach(prompt => {
      console.log(`  - ${prompt.name}: ${prompt.description}`);
    });
    console.log();

    // 测试话题灵感提示（使用字符串参数）
    try {
      console.log('🎯 测试话题灵感提示...');
      const topicPrompt = await client.getPrompt({
        name: 'topic_inspiration',
        arguments: { count: '3' }  // 使用字符串
      });
      console.log('✅ 话题灵感提示成功：');
      console.log(topicPrompt.messages[0].content.text);
      console.log();
    } catch (error) {
      console.log('❌ 获取话题灵感提示失败:', error.message);
    }

    // 测试聊天优化提示（使用字符串参数）
    try {
      console.log('🎯 测试聊天优化提示...');
      const chatPrompt = await client.getPrompt({
        name: 'chat_optimization',
        arguments: { threshold: '0.1' }  // 使用字符串
      });
      console.log('✅ 聊天优化提示成功：');
      console.log(chatPrompt.messages[0].content.text);
      console.log();
    } catch (error) {
      console.log('❌ 获取聊天优化提示失败:', error.message);
    }

    console.log('✅ 提示功能测试完成！');

    // 断开连接
    await client.close();
    console.log('🔌 客户端已断开连接');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testPromptFeatures().catch(console.error);
