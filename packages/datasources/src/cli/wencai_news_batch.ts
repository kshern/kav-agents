#!/usr/bin/env node

// 问财新闻批量抓取 CLI：从列表文件读取股票代码，逐个抓取并写入 JSONL
// 用法示例：
//   pnpm -C packages/datasources run cli:wencai-news:batch
// 可选参数：
//   --file <path>      股票代码列表文件（默认 data/wencai/symbols.jsonl）。
//                      支持以下格式：
//                        - .txt  ：每行一个代码，支持 # 注释与空行
//                        - .json ：["300233", "600519.SH"] 或 {"symbols":[...]}
//                                 也支持 [{"symbol":"300233"}, ...]
//                        - .jsonl：每行一个 JSON，可以是字符串或 {symbol:""}
//                        - .csv  ：首行含表头 symbol 时优先取该列，否则取首列
//   --outDir <path>    输出目录（默认 data/wencai/news）
//   --timeoutMs <num>  每个请求的超时（默认 60000）
//   --sleepMs <num>    每次请求之间的间隔毫秒（默认 0）

import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { fetchWencaiNews } from '../index.js';
import { appendJsonl } from '../storage/jsonl.js';
import { config } from '../config.js';

// 命令行参数类型定义（避免 any）
interface CliArgs {
  file: string; // 列表文件路径
  outDir: string; // 输出目录
  timeoutMs: number; // 单个任务超时
  sleepMs: number; // 任务间隔
}

// 解析命令行参数（无依赖，简单可靠）
function parseArgs(argv: string[]): CliArgs {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith('--')) {
      const name = key.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      args[name] = val;
    }
  }
  const cwd = process.cwd();
  const file = args['file'] ?? path.join(cwd, config.batch.defaultInputPath);
  const outDir = args['outDir'] ?? path.join(cwd, config.batch.defaultOutDir);
  const timeoutMs = args['timeoutMs'] ? Number(args['timeoutMs']) : config.batch.defaultTimeoutMs;
  const sleepMs = args['sleepMs'] ? Number(args['sleepMs']) : config.batch.defaultSleepMs;
  return { file, outDir, timeoutMs, sleepMs };
}

// 类型守卫与解析工具（避免 any）
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function isSymbolsObject(v: unknown): v is { symbols: string[] } {
  return typeof v === 'object' && v !== null && Array.isArray((v as { symbols?: unknown }).symbols);
}

function isArrayOfSymbolObjects(v: unknown): v is Array<{ symbol: string }> {
  return Array.isArray(v) && v.every((x) => typeof x === 'object' && x !== null && typeof (x as { symbol?: unknown }).symbol === 'string');
}

async function readSymbolsFromTxt(filePath: string): Promise<string[]> {
  const content = await fs.readFile(filePath, { encoding: 'utf-8' });
  return content
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
}

async function readSymbolsFromJson(filePath: string): Promise<string[]> {
  const raw = await fs.readFile(filePath, { encoding: 'utf-8' });
  const data: unknown = JSON.parse(raw);
  if (isStringArray(data)) return data;
  if (isSymbolsObject(data) && isStringArray(data.symbols)) return data.symbols;
  if (isArrayOfSymbolObjects(data)) return data.map((x) => x.symbol);
  throw new Error('JSON 格式不支持：请使用字符串数组、{symbols: string[]} 或 [{symbol: string}]');
}

async function readSymbolsFromJsonl(filePath: string): Promise<string[]> {
  const content = await fs.readFile(filePath, { encoding: 'utf-8' });
  const out: string[] = [];
  const lines = content.split(/\r?\n/g);
  for (const line of lines) {
    const s = line.trim();
    if (!s) continue;
    try {
      const v: unknown = JSON.parse(s);
      if (typeof v === 'string') {
        out.push(v);
      } else if (typeof v === 'object' && v !== null && typeof (v as { symbol?: unknown }).symbol === 'string') {
        out.push((v as { symbol: string }).symbol);
      }
    } catch {
      // 忽略无法解析的行
    }
  }
  return out;
}

async function readSymbolsFromCsv(filePath: string): Promise<string[]> {
  const content = await fs.readFile(filePath, { encoding: 'utf-8' });
  const lines = content.split(/\r?\n/g).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map((h) => h.trim().replace(/^\uFEFF/, ''));
  const hasSymbolHeader = header.some((h) => h.toLowerCase() === 'symbol');
  const symbolIdx = hasSymbolHeader ? header.findIndex((h) => h.toLowerCase() === 'symbol') : 0;
  const out: string[] = [];
  for (let i = hasSymbolHeader ? 1 : 0; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    const sym = cols[symbolIdx];
    if (sym && !sym.startsWith('#')) out.push(sym);
  }
  return out;
}

// 自动按扩展名选择解析器
async function readSymbolsAuto(listPath: string): Promise<string[]> {
  const ext = path.extname(listPath).toLowerCase();
  if (ext === '.txt' || ext === '.list') return readSymbolsFromTxt(listPath);
  if (ext === '.json') return readSymbolsFromJson(listPath);
  if (ext === '.jsonl') return readSymbolsFromJsonl(listPath);
  if (ext === '.csv') return readSymbolsFromCsv(listPath);
  // 未知扩展名，回退为按 txt 解析
  return readSymbolsFromTxt(listPath);
}

// 简单 sleep 工具
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce(symbol: string, outDir: string, timeoutMs: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = await fetchWencaiNews(symbol, { timeoutMs });
    const outPath = path.join(outDir, `${symbol}.jsonl`);
    await appendJsonl(outPath, { source: 'wencai', kind: 'news', symbol, data });
    console.log(`[wencai-news:batch] 完成 symbol=${symbol}, 输出=${outPath}`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[wencai-news:batch] 失败 symbol=${symbol}, 错误=${message}`);
    return { ok: false, error: message };
  }
}

async function main(): Promise<void> {
  const { file, outDir, timeoutMs, sleepMs } = parseArgs(process.argv);
  console.log(`[wencai-news:batch] 开始，file=${file}, outDir=${outDir}, timeoutMs=${timeoutMs}, sleepMs=${sleepMs}`);

  // 读取代码列表
  let symbols: string[] = [];
  try {
    symbols = await readSymbolsAuto(file);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[wencai-news:batch] 读取列表失败：${message}`);
    process.exit(2);
  }

  if (symbols.length === 0) {
    console.warn('[wencai-news:batch] 列表为空，退出');
    process.exit(0);
  }

  let okCount = 0;
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    console.log(`[wencai-news:batch] (${i + 1}/${symbols.length}) 抓取 symbol=${symbol}`);
    const res = await runOnce(symbol, outDir, timeoutMs);
    if (res.ok) okCount++;
    if (sleepMs > 0 && i < symbols.length - 1) {
      await sleep(sleepMs);
    }
  }

  console.log(`[wencai-news:batch] 完成，总数=${symbols.length}, 成功=${okCount}, 失败=${symbols.length - okCount}`);
}

main().catch((err) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  console.error(`[wencai-news:batch] 未捕获异常：${message}`);
  process.exit(1);
});
