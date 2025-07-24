import { ZettelkastenManager } from 'modular-mcp-memory/core';

console.log('✅ 模块导入成功');
console.log('ZettelkastenManager:', typeof ZettelkastenManager);

const manager = new ZettelkastenManager({
  storageDir: './test-simple',
  encoding: 'utf-8',
  autoCreateDir: true
});

console.log('✅ ZettelkastenManager 实例创建成功');
console.log('extractContent 方法:', typeof manager.extractContent);
