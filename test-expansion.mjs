#!/usr/bin/env node

/**
 * 测试展开功能
 */

import { ZettelkastenManager } from 'modular-mcp-memory/core';

async function testExpansion() {
  console.log('🧪 测试展开功能...\n');

  const manager = new ZettelkastenManager({
    storageDir: './test-expansion-cards',
    encoding: 'utf-8',
    autoCreateDir: true
  });

  try {
    // 1. 创建基础卡片
    await manager.setContent('基础概念', `# 编程基础

这里介绍编程的基础概念：

[[变量和数据类型]]

[[控制结构]]`);

    await manager.setContent('变量和数据类型', `## 变量和数据类型

变量是存储数据的容器。主要数据类型包括：
- 数字 (Number)
- 字符串 (String)  
- 布尔值 (Boolean)`);

    await manager.setContent('控制结构', `## 控制结构

控制结构用于控制程序的执行流程：
- if/else 条件语句
- for/while 循环语句
- switch 选择语句`);

    console.log('✅ 创建了测试卡片');

    // 2. 测试不展开
    console.log('\n📄 不展开 (expandDepth=0):');
    console.log('----------------------------------------');
    const noExpand = await manager.getContent('基础概念', 0);
    console.log(noExpand);

    // 3. 测试展开 1 层
    console.log('\n📄 展开 1 层 (expandDepth=1):');
    console.log('----------------------------------------');
    const expand1 = await manager.getContent('基础概念', 1);
    console.log(expand1);

    // 4. 检查展开是否成功
    if (expand1.includes('变量是存储数据的容器') && expand1.includes('控制结构用于控制程序的执行流程')) {
      console.log('\n✅ 展开功能正常工作！');
    } else {
      console.log('\n❌ 展开功能异常');
      console.log('展开内容不包含预期的子卡片内容');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  }
}

testExpansion().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
});
