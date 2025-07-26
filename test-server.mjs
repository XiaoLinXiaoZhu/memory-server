#!/usr/bin/env node

/**
 * 简单测试脚本，验证 memory-server 是否可以正常工作
 */

console.log('🧪 测试 Zettelkasten Memory Server...');

// 测试导入
try {
  console.log('📦 测试模块导入...');
  
  // 测试 modular-mcp-memory 包是否可以正常导入
  const { ZettelkastenManager } = await import('modular-mcp-memory/core');
  console.log('✅ modular-mcp-memory 核心包导入成功');
  
  // 创建测试实例
  const manager = new ZettelkastenManager({
    storageDir: './test-cards',
    autoCreateDir: true
  });
  console.log('✅ ZettelkastenManager 实例创建成功');
  
  // 测试基本功能
  console.log('🔍 测试基本功能...');
  
  // 创建记忆片段
  await manager.setContent('测试记忆片段', '这是一个测试记忆片段，引用了 [[另一个记忆片段]]');
  console.log('✅ 创建记忆片段成功');
  
  // 读取记忆片段
  const content = await manager.getContent('测试记忆片段');
  console.log('✅ 读取记忆片段成功:', content.substring(0, 50) + '...');
  
  // 获取提示
  const hints = await manager.getHints(5);
  console.log('✅ 获取提示成功:', hints.cardNames);
  
  console.log('🎉 所有测试通过！');
  
} catch (error) {
  console.error('❌ 测试失败:', error);
  process.exit(1);
}
