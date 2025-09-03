#!/usr/bin/env node

// 通用 Tushare 调用 CLI：适合定时任务，支持 JSONL 持久化
// 用法示例：
//   pnpm -C packages/datasources build && node dist/cli/tushare_call.js \
//     --api daily \
//     --params '{"ts_code":"600519.SH","start_date":"20250101","end_date":"20250131"}' \
//     --fields 'ts_code,trade_date,close' \
//     --out data/tushare/daily/600519.jsonl

import 'dotenv/config'; // 加载 .env，读取 TUSHARE_TOKEN
import path from 'path';
import process from 'process';
import fs from 'fs';
import { createTushareAdapter, type TushareCallInput, type TushareCallParams, type TushareRow } from '../tushare/index.js';
import { appendJsonl } from '../storage/jsonl.js';

interface CliArgs {
  api: string;
  params?: string; // JSON 字符串
  fields?: string; // 逗号分隔
  out?: string; // 输出 JSONL 路径
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = { api: '' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--api') {
      out.api = argv[++i] ?? '';
    } else if (a === '--params') {
      out.params = argv[++i] ?? '';
    } else if (a === '--fields') {
      out.fields = argv[++i] ?? '';
    } else if (a === '--out') {
      out.out = argv[++i] ?? '';
    } else if (a === '--help' || a === '-h') {
      printHelpAndExit();
    }
  }
  if (!out.api) {
    console.error('[tushare-call] 缺少 --api 参数');
    printHelpAndExit(1);
  }
  return out;
}

function printHelpAndExit(code: number = 0): never {
  console.log(`用法: tushare-call --api <name> [--params '{"k":"v"}'] [--fields 'a,b,c'] [--out path]`);
  process.exit(code);
}

function parseParams(json?: string): TushareCallParams | undefined {
  if (!json) return undefined;
  try {
    const obj = JSON.parse(json) as unknown;
    if (obj && typeof obj === 'object') {
      const rec = obj as Record<string, unknown>;
      const out: TushareCallParams = {};
      for (const k of Object.keys(rec)) {
        const v = rec[k];
        if (
          typeof v === 'string' ||
          typeof v === 'number' ||
          typeof v === 'boolean' ||
          v === null ||
          typeof v === 'undefined'
        ) {
          out[k] = v as string | number | boolean | null | undefined;
        } else {
          out[k] = String(v) as string; // 保底转为字符串
        }
      }
      return out;
    }
  } catch (e) {
    console.error('[tushare-call] --params JSON 解析失败:', e);
    process.exit(1);
  }
  return undefined;
}

function parseFields(s?: string): string[] | undefined {
  if (!s) return undefined;
  const parts = s
    .split(/[;,]/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
  return parts.length > 0 ? parts : undefined;
}

function defaultOutPath(api: string, params?: TushareCallParams): string {
  // 优先用 ts_code/ symbol 等字段命名，否则只用 api
  const candKeys = ['ts_code', 'symbol', 'code'];
  let suffix = '';
  if (params) {
    for (const k of candKeys) {
      const v = params[k];
      if (typeof v === 'string' && v.trim()) {
        suffix = `/${v.trim()}`;
        break;
      }
    }
  }
  return path.join('data', 'tushare', api, `${suffix ? suffix : ''}.jsonl`).replace(/\\/g, '/');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const params = parseParams(args.params);
  const fields = parseFields(args.fields);

  const callInput: TushareCallInput = {
    api: args.api,
    params,
    fields,
  };

  const adapter = await createTushareAdapter();
  const rows: TushareRow[] = await adapter.call(callInput);

  const outPath = args.out && args.out.trim().length > 0 ? args.out : defaultOutPath(args.api, params);
  // 确保目录存在
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  await appendJsonl(outPath, {
    ts: new Date().toISOString(),
    source: 'tushare',
    api: args.api,
    params: params ?? {},
    fields: fields ?? [],
    data: rows,
  });

  console.log(`[tushare-call] 已输出 ${rows.length} 行到 ${outPath}`);
}

main().catch((err) => {
  console.error('[tushare-call] 发生错误:', err);
  process.exit(1);
});
