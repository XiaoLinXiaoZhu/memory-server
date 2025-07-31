#!/usr/bin/env node
import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_STORAGE_DIR = path.join(__dirname, 'test-cards-setContent');

async function cleanup() {
  if (await fs.pathExists(TEST_STORAGE_DIR)) {
    await fs.remove(TEST_STORAGE_DIR);
  }
}

async function testSetContent() {
  await cleanup();
  const env = { ...process.env, ZETTELKASTEN_STORAGE_DIR: TEST_STORAGE_DIR };
  const serverProcess = spawn('node', [path.join(__dirname, '..', 'build', 'index.js')], {
    env,
    stdio: ['pipe', 'pipe', 'inherit'],
    cwd: path.join(__dirname, '..')
  });
  const requests = [
    // 1. 未 getContent 直接 setContent 应报错
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'setMemory', arguments: { fragmentName: 'B', content: '内容B' } } },
    // 2. getContent 后 setContent 应成功
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'getMemory', arguments: { fragmentName: 'B' } } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'setMemory', arguments: { fragmentName: 'B', content: '内容B' } } }
  ];
  let requestIndex = 0;
  function sendNextRequest() {
    if (requestIndex >= requests.length) { serverProcess.kill(); return; }
    serverProcess.stdin.write(JSON.stringify(requests[requestIndex]) + '\n');
    requestIndex++;
  }
  serverProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        try { JSON.parse(line); } catch { }
      }
    }
    setTimeout(sendNextRequest, 200);
  });
  serverProcess.on('close', async () => { await cleanup(); });
  setTimeout(sendNextRequest, 1000);
}
testSetContent().catch(console.error); 