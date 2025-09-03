#!/usr/bin/env node

// 问财新闻抓取 CLI：独立执行，便于定时任务调度
// 用法示例：
//   pnpm -C packages/datasources build && node dist/cli/wencai_news.js --symbol 300233 --out data/wencai/news/300233.jsonl --timeoutMs 90000
// 或安装到 PATH 后：
//   wencai-news --symbol 300233 --out data/wencai/news/300233.jsonl --timeoutMs 90000

import 'dotenv/config'; // 加载 .env 环境变量，支持下游数据源（如 TUSHARE_TOKEN）
import path from 'path';
import process from 'process';
import { fetchWencaiNews } from '../index.js';
import { appendJsonl } from '../storage/jsonl.js';

// 解析命令行参数（简单解析，无依赖）
interface CliArgs {
  symbol: string;
  out?: string;
  timeoutMs?: number;
}

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
  const symbol = args['symbol'];
  if (!symbol) {
    console.error('缺少必需参数：--symbol <股票代码>');
    process.exit(2);
  }
  const out = args['out'];
  const timeoutMsRaw = args['timeoutMs'];
  const timeoutMs = timeoutMsRaw ? Number(timeoutMsRaw) : undefined;
  return { symbol, out, timeoutMs };
}

async function main() {
  const { symbol, out, timeoutMs } = parseArgs(process.argv);
  const outputPath = out ?? path.join(process.cwd(), 'data', 'wencai', 'news', `${symbol}.jsonl`);

  console.log(`[wencai-news] 开始抓取 symbol=${symbol}, timeoutMs=${timeoutMs ?? 60000}`);
  try {
    const data = await fetchWencaiNews(symbol, { timeoutMs });
    // 记录到 JSONL，附带 symbol 字段
    await appendJsonl(outputPath, { source: 'wencai', kind: 'news', symbol, data });
    console.log(`[wencai-news] 抓取完成，已写入 ${outputPath}`);
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[wencai-news] 抓取失败：${message}`);
    process.exit(1);
  }
}

main();
