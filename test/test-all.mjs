#!/usr/bin/env node
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const testDir = path.dirname(fileURLToPath(import.meta.url));

// 整理后的测试文件列表 - 按单一函数分类
const testFiles = [
  'test-set.mjs',
  'test-get.mjs',
  'test-delete.mjs',
  'test-rename.mjs',
  'test-extract.mjs',
  'test-hints.mjs',
  'test-suggestions.mjs',
  'test-backlinks.mjs',
  'test-insert-link.mjs',
  'test-protection.mjs',
  'test-repeat-access.mjs'
].filter(f => fs.existsSync(path.join(testDir, f)));

// 已废弃的测试文件列表（将被删除）
const deprecatedFiles = [
  'test-main.mjs',
  'test-new-methods.mjs',
  'test-fragment-name.mjs',
  'test-fragment-name-params.mjs',
  'test-core-features.mjs',
  'test-getContent.mjs',
  'test-setContent.mjs',
  'test-long-content.mjs',
  'test-hints.mjs', // 重复
  'test-get-suggestions.mjs', // 重复
  'test-protection.mjs', // 重复
  'test-repeat-access-basic.mjs',
  'test-repeat-access-reset.mjs',
  'new-features.test.mjs',
  'simple-test.mjs',
  'direct-test.mjs',
  'debug-response.mjs'
];

async function runTest(file) {
  return new Promise((resolve) => {
    console.log(`\n🚀 开始运行: ${file}`);
    console.log('='.repeat(50));
    
    const proc = spawn('node', [path.join(testDir, file)], { 
      stdio: 'inherit',
      cwd: testDir
    });
    
    proc.on('close', code => {
      const status = code === 0 ? '✅ 通过' : '❌ 失败';
      console.log(`${status} ${file} (退出码: ${code})`);
      console.log('='.repeat(50));
      resolve({ file, code, passed: code === 0 });
    });
    
    proc.on('error', (error) => {
      console.log(`❌ 运行失败 ${file}:`, error.message);
      resolve({ file, code: 1, passed: false, error: error.message });
    });
  });
}

async function runTestsSequentially() {
  console.log('🧪 开始运行 memory-server 测试...\n');
  console.log(`📁 测试目录: ${testDir}`);
  console.log(`📋 测试文件: ${testFiles.length} 个\n`);
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const file of testFiles) {
    const result = await runTest(file);
    results.push(result);
    
    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
    
    // 在测试之间添加短暂延迟
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 测试汇总报告');
  console.log('='.repeat(50));
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📊 总计: ${testFiles.length}`);
  console.log(`📈 通过率: ${((passed / testFiles.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ 失败的测试:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.file}`);
      if (r.error) console.log(`    错误: ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  if (failed === 0) {
    console.log('🎉 所有测试通过！');
    process.exit(0);
  } else {
    console.log('❌ 部分测试失败！');
    process.exit(1);
  }
}

// 清理废弃的测试文件
async function cleanupDeprecatedFiles() {
  console.log('\n🧹 清理废弃的测试文件...');
  let cleaned = 0;
  
  for (const file of deprecatedFiles) {
    const filePath = path.join(testDir, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`  🗑️  已删除: ${file}`);
        cleaned++;
      } catch (error) {
        console.log(`  ⚠️  无法删除: ${file} (${error.message})`);
      }
    }
  }
  
  if (cleaned > 0) {
    console.log(`✅ 已清理 ${cleaned} 个废弃文件`);
  } else {
    console.log('ℹ️  没有需要清理的废弃文件');
  }
}

// 处理命令行参数
const args = process.argv.slice(2);

if (args.includes('--cleanup')) {
  cleanupDeprecatedFiles().then(() => process.exit(0));
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
用法: node test-all.mjs [选项]

选项:
  --help, -h     显示帮助信息
  --list, -l     列出所有测试文件
  --cleanup      清理废弃的测试文件
  --file <name>  运行指定测试文件

示例:
  node test-all.mjs              # 运行所有测试
  node test-all.mjs --list       # 列出测试文件
  node test-all.mjs --file test-set.mjs  # 运行指定测试
  node test-all.mjs --cleanup    # 清理废弃文件
  `);
  process.exit(0);
} else if (args.includes('--list') || args.includes('-l')) {
  console.log('\n📋 可用的测试文件:');
  testFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  process.exit(0);
}

const specificFile = args.find((arg, index) => 
  args[index - 1] === '--file' || args[index - 1] === '-f'
);

if (specificFile) {
  if (testFiles.includes(specificFile)) {
    runTest(specificFile).then(() => process.exit(0));
  } else {
    console.error(`❌ 测试文件不存在: ${specificFile}`);
    console.log('使用 --list 查看可用测试文件');
    process.exit(1);
  }
} else {
  // 先清理废弃文件，然后运行测试
  cleanupDeprecatedFiles()
    .then(() => runTestsSequentially())
    .catch(console.error);
}