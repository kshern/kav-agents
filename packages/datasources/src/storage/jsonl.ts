// 追加写入 JSONL 文件的简易工具（服务端使用）
// 每条记录为一行合法 JSON 字符串，并自动附加时间戳（ISO）
import { promises as fs } from 'fs';
import path from 'path';

export type JsonObject = Record<string, unknown>;

export interface AppendJsonlOptions {
  ensureDir?: boolean; // 是否在不存在时创建目录
}

export async function appendJsonl(filePath: string, record: JsonObject, options?: AppendJsonlOptions): Promise<void> {
  const { ensureDir = true } = options ?? {};
  if (ensureDir) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }
  const enriched = { ts: new Date().toISOString(), ...record };
  const line = `${JSON.stringify(enriched)}\n`;
  await fs.appendFile(filePath, line, { encoding: 'utf-8' });
}
