// 文件读取工具集：支持多种格式的股票代码列表解析
import { promises as fs } from 'fs';
import path from 'path';
import { isStringArray, isSymbolsObject, isArrayOfSymbolObjects } from './typeGuards.js';

// 通用文件读取错误处理
async function safeReadFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, { encoding: 'utf-8' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`读取文件失败 ${filePath}: ${message}`);
  }
}

// TXT 格式：每行一个代码，支持 # 注释与空行
export async function readSymbolsFromTxt(filePath: string): Promise<string[]> {
  const content = await safeReadFile(filePath);
  return content
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
}

// JSON 格式：支持字符串数组、{symbols: string[]} 或 [{symbol: string}]
export async function readSymbolsFromJson(filePath: string): Promise<string[]> {
  const raw = await safeReadFile(filePath);
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`JSON 解析失败 ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
  }
  
  if (isStringArray(data)) return data;
  if (isSymbolsObject(data) && isStringArray(data.symbols)) return data.symbols;
  if (isArrayOfSymbolObjects(data)) return data.map((x) => x.symbol);
  throw new Error('JSON 格式不支持：请使用字符串数组、{symbols: string[]} 或 [{symbol: string}]');
}

// JSONL 格式：每行一个 JSON，可以是字符串或 {symbol:""}
export async function readSymbolsFromJsonl(filePath: string): Promise<string[]> {
  const content = await safeReadFile(filePath);
  const out: string[] = [];
  const lines = content.split(/\r?\n/g);
  
  for (const [lineNum, line] of lines.entries()) {
    const s = line.trim();
    if (!s) continue;
    
    try {
      const v: unknown = JSON.parse(s);
      if (typeof v === 'string') {
        out.push(v);
      } else if (typeof v === 'object' && v !== null && typeof (v as { symbol?: unknown }).symbol === 'string') {
        out.push((v as { symbol: string }).symbol);
      }
    } catch (err) {
      console.warn(`JSONL 第 ${lineNum + 1} 行解析失败，跳过: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return out;
}

// CSV 格式：首行含表头 symbol 时优先取该列，否则取首列
export async function readSymbolsFromCsv(filePath: string): Promise<string[]> {
  const content = await safeReadFile(filePath);
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
export async function readSymbolsAuto(listPath: string): Promise<string[]> {
  const ext = path.extname(listPath).toLowerCase();
  
  switch (ext) {
    case '.txt':
    case '.list':
      return readSymbolsFromTxt(listPath);
    case '.json':
      return readSymbolsFromJson(listPath);
    case '.jsonl':
      return readSymbolsFromJsonl(listPath);
    case '.csv':
      return readSymbolsFromCsv(listPath);
    default:
      // 未知扩展名，回退为按 txt 解析
      console.warn(`未知文件扩展名 ${ext}，按 TXT 格式解析`);
      return readSymbolsFromTxt(listPath);
  }
}
