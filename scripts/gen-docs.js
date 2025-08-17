#!/usr/bin/env node
/*
  gen-docs.js
  递归扫描 packages/core 与 packages/web 下的 .ts/.tsx 文件，为每个文件生成同名 .md 文档。
  选项：
    --force   覆盖已存在的 .md 文档
    --dry     干跑，不写文件，仅打印将要发生的操作
    --verbose 输出更详细的信息
*/

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const ROOT = process.cwd();
const TARGET_DIRS = [
  path.join(ROOT, 'packages', 'core'),
  path.join(ROOT, 'packages', 'web'),
];

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  'out',
  '.turbo',
  '.git',
  '.cache',
  'coverage',
  '.vercel',
  '.idea',
]);

const args = new Set(process.argv.slice(2));
const FORCE = args.has('--force');
const DRY = args.has('--dry');
const VERBOSE = args.has('--verbose') || args.has('-v');
const FILL = args.has('--fill');

function log(...msg) {
  console.log('[gen-docs]', ...msg);
}

function vlog(...msg) {
  if (VERBOSE) console.log('[gen-docs][v]', ...msg);
}

function isTsFile(file) {
  if (!file) return false;
  if (file.endsWith('.d.ts')) return false; // 跳过类型声明
  return file.endsWith('.ts') || file.endsWith('.tsx');
}

function isApiRouteFile(file) {
  // Next.js App Router: .../src/app/**/route.ts
  const relPath = rel(file).replace(/\\/g, '/');
  return /packages\/web\/src\/app\/.+\/route\.ts$/.test(relPath);
}

function toApiPathFromFile(file) {
  // Convert file path to HTTP path, replacing [param] => :param
  const relPath = rel(file).replace(/\\/g, '/');
  const m = relPath.match(/packages\/web\/src\/app\/(.+)\/route\.ts$/);
  if (!m) return null;
  const segs = m[1]
    .split('/')
    .map(s => s.replace(/^\[(.+)\]$/, ':$1'));
  return '/' + segs.join('/');
}

async function walk(dir, fileHandler) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.name.startsWith('.')) {
      // 隐藏目录按忽略处理
      if (ent.isDirectory()) continue;
    }
    if (ent.isDirectory()) {
      if (IGNORED_DIRS.has(ent.name)) continue;
      await walk(path.join(dir, ent.name), fileHandler);
    } else if (ent.isFile()) {
      const full = path.join(dir, ent.name);
      if (isTsFile(full)) await fileHandler(full);
    }
  }
}

function rel(p) {
  return path.relative(ROOT, p) || p;
}

function extractImports(content) {
  const importRegex = /import\s+[^'"\n]+from\s+['\"]([^'\"]+)['\"];?|import\s+['\"]([^'\"]+)['\"]/g;
  const modules = new Set();
  let m;
  while ((m = importRegex.exec(content))) {
    const mod = m[1] || m[2];
    if (mod) modules.add(mod);
  }
  return Array.from(modules);
}

function extractExports(content) {
  const results = [];

  // export function foo(a: T, b): R {}
  const exportFn = /export\s+function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/g;
  let m;
  while ((m = exportFn.exec(content))) {
    results.push({ kind: 'function', name: m[1], params: m[2] || '' });
  }

  // export const foo = (a, b) => {}
  const exportConstArrow = /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*\(([^)]*)\)\s*=>/g;
  while ((m = exportConstArrow.exec(content))) {
    results.push({ kind: 'function', name: m[1], params: m[2] || '' });
  }

  // export const foo = function(a, b) {}
  const exportConstFn = /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*function\s*\(([^)]*)\)/g;
  while ((m = exportConstFn.exec(content))) {
    results.push({ kind: 'function', name: m[1], params: m[2] || '' });
  }

  // export class Foo {}
  const exportClass = /export\s+class\s+([A-Za-z0-9_]+)/g;
  while ((m = exportClass.exec(content))) {
    results.push({ kind: 'class', name: m[1], params: '' });
  }

  // export type X = ..., export interface Y { ... }
  const exportType = /export\s+(type|interface)\s+([A-Za-z0-9_]+)/g;
  while ((m = exportType.exec(content))) {
    results.push({ kind: m[1], name: m[2], params: '' });
  }

  // export default function Name(a, b) {...}
  const exportDefaultNamedFn = /export\s+default\s+function\s+([A-Za-z0-9_]+)?\s*\(([^)]*)\)/g;
  while ((m = exportDefaultNamedFn.exec(content))) {
    results.push({ kind: 'default_function', name: m[1] || 'default', params: m[2] || '' });
  }

  // export default class Name {...}
  const exportDefaultClass = /export\s+default\s+class\s+([A-Za-z0-9_]+)?/g;
  while ((m = exportDefaultClass.exec(content))) {
    results.push({ kind: 'default_class', name: m[1] || 'default', params: '' });
  }

  // export default something
  const exportDefaultAny = /export\s+default\s+([A-Za-z0-9_]+)/g;
  while ((m = exportDefaultAny.exec(content))) {
    // 避免覆盖前面 default function/class 捕获
    if (!results.some(r => r.kind.startsWith('default'))) {
      results.push({ kind: 'default', name: m[1], params: '' });
    }
  }

  return results;
}

function sanitizeParams(params) {
  if (!params) return [];
  return params
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/\/?\*.*?\*\//g, '')) // 去多行注释
    .map(s => s.replace(/\/\/.*$/, '')) // 去行内注释
    .map(s => s.split(':')[0].trim()) // 去类型部分
    .map(s => s.split('=')[0].trim()); // 去默认值
}

function mdTemplate({ relPath, imports, exports }) {
  const date = new Date().toISOString();
  const externalDeps = imports.filter(m => !m.startsWith('.') && !m.startsWith('/'));
  const localDeps = imports.filter(m => m.startsWith('.') || m.startsWith('/'));

  let exportsMd = exports.length
    ? exports
        .map((e) => {
          const params = sanitizeParams(e.params || '');
          const paramList = params.length ? params.map(p => `- ${p}: <类型/说明>`).join('\n') : '- (无参数)';
          const ret = '<返回值说明 / 类型>'; // 占位
          const title = `${e.kind} ${e.name}`;
          return `### ${title}\n\n- 形态: ${e.kind}\n- 名称: ${e.name}\n- 参数:\n${paramList}\n- 返回: ${ret}`;
        })
        .join('\n\n')
    : '_未检测到导出（或解析失败，需手工补充）_';

  return `---\n# 自动生成文档（草稿）\n# 请补充描述，并在完善后移除该提示\n---\n\n# ${relPath}\n\n> 本文档由脚本自动生成，旨在作为初稿。请在代码变更后同步维护。\n\n## 概述\n\n- 文件职责：<简述该文件做什么>\n- 上下文/模块：<相关子系统或域>\n\n## 位置与命名\n\n- 相对路径：\`${relPath}\`\n- 同名文档：同目录下同名 .md\n\n## 导出清单\n\n${exportsMd}\n\n## 主要依赖\n\n- 外部依赖(${externalDeps.length})：${externalDeps.map(m => `\`${m}\``).join(', ') || '无'}\n- 本地依赖(${localDeps.length})：${localDeps.map(m => `\`${m}\``).join(', ') || '无'}\n\n## 输入 / 输出\n\n- 输入：<参数、上下文、事件、数据流>\n- 输出：<返回值、产生的副作用、事件、持久化>\n\n## 使用示例\n\n~~~ts\n// TODO: 提供一个最小示例\n~~~\n\n## 变更记录\n\n- 生成时间：${date}\n`;
}
 
function extractTopJsDoc(content) {
  const m = content.match(/\/\*\*([\s\S]*?)\*\//);
  if (!m) return null;
  return m[1]
    .split('\n')
    .map(l => l.replace(/^\s*\*\s?/, '').trim())
    .join(' ')
    .trim();
}

function extractRuntime(content) {
  const m = content.match(/export\s+const\s+runtime\s*=\s*['"]([^'"]+)['"]/);
  return m ? m[1] : null;
}

function extractHttpMethods(content) {
  const methods = new Set();
  const re = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s*\(/g;
  let m;
  while ((m = re.exec(content))) methods.add(m[1]);
  return Array.from(methods);
}

function extractQueryParams(content) {
  const params = new Set();
  const re = /searchParams\.get\(\s*['"]([A-Za-z0-9_-]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(content))) params.add(m[1]);
  return Array.from(params);
}

function detectSSE(content) {
  return /text\/event-stream/.test(content) || /new\s+ReadableStream\s*\(/.test(content);
}

function detectAuth(content) {
  const usesSupabase = /createSupabaseServerClient\(/.test(content);
  const getUser = /auth\.getUser\(\)/.test(content);
  return usesSupabase && getUser;
}

function detectPersistence(content) {
  const jsonl = /appendJSONLSafe\(/.test(content) || /\.jsonl['"]/i.test(content);
  const steps = /\.steps\.jsonl/i.test(content);
  return { jsonl, steps };
}

function apiRouteTemplate({ file, relPath, content, imports, exports }) {
  const date = new Date().toISOString();
  const endpoint = toApiPathFromFile(file) || toApiPathFromFile(relPath) || '(解析失败)';
  const methods = extractHttpMethods(content);
  const runtime = extractRuntime(content);
  const qs = extractQueryParams(content);
  const hasSSE = detectSSE(content);
  const hasAuth = detectAuth(content);
  const persist = detectPersistence(content);
  const jsdoc = extractTopJsDoc(content);

  const externalDeps = imports.filter(m => !m.startsWith('.') && !m.startsWith('/'));
  const localDeps = imports.filter(m => m.startsWith('.') || m.startsWith('/'));

  const sseSection = hasSSE
    ? `- SSE: 是（Content-Type: text/event-stream）\n- 事件类型（推断）：started/progress/final/error/aborted\n- 心跳：可能每 25s 发送 \`:heartbeat\` 保活（若实现）\n`
    : '- SSE: 否';

  const authSection = hasAuth
    ? '- 认证：使用 Supabase，会在未登录时返回 401'
    : '- 认证：未检测到强制校验';

  const persistSection = (persist.jsonl || persist.steps)
    ? `- 持久化：${persist.jsonl ? '写入 data/<analysisId>.jsonl；' : ''}${persist.steps ? '步骤日志写入 data/<analysisId>.steps.jsonl；' : ''}`
    : '- 持久化：未检测到';

  return `---\n# 自动生成文档（草稿）\n# 请补充描述，并在完善后移除该提示\n---\n\n# ${relPath}\n\n> 本文档由脚本自动生成，并基于代码静态分析填充关键字段。\n\n## 概述\n\n- 文件职责：${jsdoc || 'Next.js API 路由处理器'}\n- 上下文/模块：App Router API route\n\n## 端点信息\n\n- 路径：\`${endpoint}\`\n- 运行时：${runtime || '默认'}\n- 方法：${methods.length ? methods.join(', ') : '未检测到导出方法（或需动态导出）'}\n- 查询参数：${qs.length ? qs.map(q=>`\`${q}\``).join(', ') : '无/未使用'}\n${sseSection}\n${authSection}\n${persistSection}\n\n## 导出清单\n\n${exports.length ? exports.map(e => `- ${e.kind} ${e.name}`).join('\n') : '_未检测到导出_'}\n\n## 主要依赖\n\n- 外部依赖(${externalDeps.length})：${externalDeps.map(m => `\`${m}\``).join(', ') || '无'}\n- 本地依赖(${localDeps.length})：${localDeps.map(m => `\`${m}\``).join(', ') || '无'}\n\n## 输入 / 输出\n\n- 输入：请求对象（含查询参数）；${hasAuth ? '要求已认证用户；' : ''}${hasSSE ? 'SSE 连接；' : ''}\n- 输出：${hasSSE ? 'SSE 事件流（JSON 字符串）' : 'JSON 响应'}\n\n## 示例\n\n${hasSSE ? '~~~bash\n# 连接 SSE\ncurl -N \'http://localhost:3000' + endpoint + (qs.length? `?${qs.map(q=> q+"=<value>").join('&')}` : '') + '\'\n~~~' : '~~~bash\n# 示例\ncurl -X ' + (methods[0] || 'GET') + ' http://localhost:3000' + endpoint + '\n~~~'}\n\n## 变更记录\n\n- 生成时间：${date}\n`;
}

async function shouldSkipExisting(docFile) {
  if (FORCE) return false;
  try {
    const buf = await fsp.readFile(docFile, 'utf8');
    if (FILL) {
      return !buf.includes('# 自动生成文档（草稿）');
    }
    return true;
  } catch {
    return false;
  }
}
async function ensureMdForFile(tsFile) {
  const docFile = tsFile.replace(/\.(tsx|ts)$/i, '.md');
  const relTs = rel(tsFile);
  const relMd = rel(docFile);

  if (await shouldSkipExisting(docFile)) {
    vlog('skip existing', relMd);
    return { action: 'skip', file: tsFile, doc: docFile };
  }

  const content = await fsp.readFile(tsFile, 'utf8');
  const imports = extractImports(content);
  const exports = extractExports(content);
  const isApi = isApiRouteFile(tsFile);
  const out = isApi
    ? apiRouteTemplate({ file: tsFile, relPath: relTs, content, imports, exports })
    : mdTemplate({ relPath: relTs, imports, exports });

  if (DRY) {
    log('would write', relMd);
    return { action: 'dry', file: tsFile, doc: docFile };
  }

  await fsp.writeFile(docFile, out, 'utf8');
  log('wrote', relMd);
  return { action: 'write', file: tsFile, doc: docFile };
}

async function main() {
  log('start');
  log('root:', ROOT);
  log('targets:', TARGET_DIRS.map(rel).join(', '));
  log('options:', JSON.stringify({ FORCE, DRY, VERBOSE, FILL }));

  let total = 0;
  for (const d of TARGET_DIRS) {
    try {
      const stat = await fsp.stat(d);
      if (!stat.isDirectory()) continue;
    } catch (e) {
      vlog('skip missing dir', rel(d));
      continue;
    }

    await walk(d, async (file) => {
      total++;
      await ensureMdForFile(file);
    });
  }

  log('done. scanned ts files =', total);
}

main().catch((err) => {
  console.error('[gen-docs][error]', err);
  process.exitCode = 1;
});
