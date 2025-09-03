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
//   --limit <num>      每只股票单次写入的最大新闻条数（默认 config.batch.defaultItemsLimit）

import "dotenv/config";
import path from "path";
import process from "process";
import { fetchWencaiNews } from "../index.js";
import { prependJsonlUniqueByUid } from "../storage/jsonl.js";
import { config } from "../config.js";
import { readSymbolsAuto } from "../utils/fileReaders.js";
import {
  extractNewsItemsWithUid,
  type ItemWithUid,
} from "../utils/typeGuards.js";

// 命令行参数类型定义（避免 any）
interface CliArgs {
  file: string; // 列表文件路径
  outDir: string; // 输出目录
  timeoutMs: number; // 单个任务超时
  sleepMs: number; // 任务间隔
  limit: number; // 每只股票单次写入上限
}

// 解析命令行参数（无依赖，简单可靠）
function parseArgs(argv: string[]): CliArgs {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith("--")) {
      const name = key.slice(2);
      const val =
        argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      args[name] = val;
    }
  }
  const cwd = process.cwd();
  const file = args["file"] ?? path.join(cwd, config.batch.defaultInputPath);
  const outDir = args["outDir"] ?? path.join(cwd, config.batch.defaultOutDir);

  // 参数验证与转换
  const timeoutMs = args["timeoutMs"]
    ? validateNumber(args["timeoutMs"], "timeoutMs", 1000, 300000)
    : config.batch.defaultTimeoutMs;
  const sleepMs = args["sleepMs"]
    ? validateNumber(args["sleepMs"], "sleepMs", 0, 60000)
    : config.batch.defaultSleepMs;
  const limit = args["limit"]
    ? validateNumber(args["limit"], "limit", 1, 2000)
    : config.batch.defaultItemsLimit;

  return { file, outDir, timeoutMs, sleepMs, limit };
}

// 数字参数验证
function validateNumber(
  value: string,
  name: string,
  min: number,
  max: number
): number {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    throw new Error(
      `参数 ${name} 必须是 ${min}-${max} 之间的数字，当前值: ${value}`
    );
  }
  return num;
}

// 简单 sleep 工具
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 处理单个股票代码的抓取任务
async function runOnce(
  symbol: string,
  outDir: string,
  timeoutMs: number,
  limit: number
): Promise<{ ok: boolean; error?: string; written?: number; limited?: number }> {
  try {
    const data = await fetchWencaiNews(symbol, { timeoutMs, limit });

    // 提取包含 uid 的新闻条目数组（从抓取结果中自动发现）
    const items = extractNewsItemsWithUid(data);
    if (items.length === 0) {
      console.warn(
        `[wencai-news:batch] symbol=${symbol} 无可写入的含 uid 新闻，跳过`
      );
      return { ok: true, written: 0 };
    }

    const outPath = path.join(outDir, `${symbol}.jsonl`);

    // 将新增记录插入文件头部（遇到第一条已存在的 uid 即停止）
    const written = await prependJsonlUniqueByUid(
      outPath,
      items.map((it) => ({
        uid: it.uid,
        source: "wencai",
        kind: "news",
        symbol,
        item: it,
      }))
    );

    console.log(
      `[wencai-news:batch] 完成 symbol=${symbol}, 输出=${outPath}, 抓取上限=${limit}, 实际取样=${items.length}, 新增=${written}`
    );
    return { ok: true, written, limited: items.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[wencai-news:batch] 失败 symbol=${symbol}, 错误=${message}`);
    return { ok: false, error: message };
  }
}

async function main(): Promise<void> {
  const { file, outDir, timeoutMs, sleepMs, limit } = parseArgs(process.argv);
  console.log(
    `[wencai-news:batch] 开始，file=${file}, outDir=${outDir}, timeoutMs=${timeoutMs}, sleepMs=${sleepMs}, limit=${limit}`
  );

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
    console.warn("[wencai-news:batch] 列表为空，退出");
    process.exit(0);
  }

  let okCount = 0;
  let totalWritten = 0;

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    console.log(
      `[wencai-news:batch] (${i + 1}/${symbols.length}) 抓取 symbol=${symbol}`
    );

    const res = await runOnce(symbol, outDir, timeoutMs, limit);
    if (res.ok) {
      okCount++;
      totalWritten += res.written ?? 0;
    }

    if (sleepMs > 0 && i < symbols.length - 1) {
      await sleep(sleepMs);
    }
  }

  console.log(
    `[wencai-news:batch] 完成，总数=${symbols.length}, 成功=${okCount}, 失败=${symbols.length - okCount}, 总写入=${totalWritten}`
  );
}

main().catch((err) => {
  const message =
    err instanceof Error ? (err.stack ?? err.message) : String(err);
  console.error(`[wencai-news:batch] 未捕获异常：${message}`);
  process.exit(1);
});
