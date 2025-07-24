#!/usr/bin/env node

/**
 * 测试 extractContent 功能
 */

import { ZettelkastenManager } from 'modular-mcp-memory/core';

async function testextractContent() {
  console.log('🧪 测试 extractContent 功能...\n');

  const manager = new ZettelkastenManager({
    storageDir: './test-extra-cards',
    encoding: 'utf-8',
    autoCreateDir: true
  });

  try {
    // 1. 创建一个包含长内容的卡片
    const originalContent = `# JavaScript 基础知识

JavaScript 是一种高级的、解释型的编程语言。它具有以下特点：

## 动态类型
JavaScript 是动态类型语言，变量的类型在运行时确定。这意味着你可以在同一个变量中存储不同类型的值。

## 原型继承
JavaScript 使用原型继承而不是经典的类继承。每个对象都有一个原型，可以从原型继承属性和方法。

## 事件驱动
JavaScript 是事件驱动的语言，特别适合处理用户交互和异步操作。`;

    await manager.setContent('JavaScript基础', originalContent);
    console.log('✅ 创建了原始卡片: JavaScript基础');

    // 2. 使用 extractContent 提取"动态类型"部分
    const contentToExtract = `## 动态类型
JavaScript 是动态类型语言，变量的类型在运行时确定。这意味着你可以在同一个变量中存储不同类型的值。`;

    await manager.extractContent('JavaScript基础', contentToExtract, '动态类型');
    console.log('✅ 提取了"动态类型"内容到新卡片');

    // 3. 验证结果
    const updatedOriginal = await manager.getContent('JavaScript基础');
    const extractedContent = await manager.getContent('动态类型');

    console.log('\n📄 更新后的原始卡片内容:');
    console.log('----------------------------------------');
    console.log(updatedOriginal);

    console.log('\n📄 新提取的卡片内容:');
    console.log('----------------------------------------');
    console.log(extractedContent);

    // 4. 验证链接是否正确
    if (updatedOriginal.includes('[[动态类型]]')) {
      console.log('\n✅ 链接替换成功！原始卡片现在包含 [[动态类型]] 链接');
    } else {
      console.log('\n❌ 链接替换失败');
    }

    if (extractedContent.includes('动态类型')) {
      console.log('✅ 新卡片包含正确的内容');
    } else {
      console.log('❌ 新卡片内容不正确');
    }

    console.log('\n🎉 extractContent 功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

testextractContent().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});
