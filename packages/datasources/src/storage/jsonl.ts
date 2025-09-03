// 追加写入 JSONL 文件的简易工具（服务端使用）
// 每条记录为一行合法 JSON 字符串，并自动附加时间戳（ISO）
import { promises as fs, createReadStream, createWriteStream } from 'fs';
import path from 'path';

export type JsonObject = Record<string, unknown>;

export interface AppendJsonlOptions {
  ensureDir?: boolean; // 是否在不存在时创建目录
}

export async function appendJsonl(filePath: string, record: JsonObject, options?: AppendJsonlOptions): Promise<void> {
  const { ensureDir = true } = options ?? {};
  if (ensureDir) {
    await ensureDirectory(filePath);
  }
  const enriched = { ts: new Date().toISOString(), ...record };
  const line = `${JSON.stringify(enriched)}\n`;
  await fs.appendFile(filePath, line, { encoding: 'utf-8' });
}

// 读取 JSONL 文件的第一行并返回解析后的对象；若文件不存在或为空返回 null
// 优化版本：仅读取必要字节，避免大文件全量加载
export async function readFirstJsonl(filePath: string): Promise<JsonObject | null> {
  try {
    const fh = await fs.open(filePath, 'r');
    try {
      // 分块读取，寻找第一个换行符
      const buffer = Buffer.alloc(8192); // 8KB 缓冲区
      const { bytesRead } = await fh.read(buffer, 0, buffer.length, 0);
      if (bytesRead === 0) return null;
      
      const content = buffer.subarray(0, bytesRead).toString('utf-8');
      const idx = content.indexOf('\n');
      const firstLine = idx >= 0 ? content.slice(0, idx) : content;
      const s = firstLine.trim();
      if (!s) return null;
      
      const obj = JSON.parse(s) as JsonObject;
      return obj;
    } finally {
      await fh.close();
    }
  } catch {
    return null;
  }
}

// 确保目录存在的通用函数
async function ensureDirectory(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

// 将多条记录插入到文件头部（保持传入顺序）；若文件不存在则等同于新建
// 优化版本：使用临时文件避免大文件内存占用
export async function prependJsonl(filePath: string, records: JsonObject[], options?: AppendJsonlOptions): Promise<void> {
  const { ensureDir = true } = options ?? {};
  if (ensureDir) {
    await ensureDirectory(filePath);
  }
  
  if (records.length === 0) return;
  
  const now = new Date().toISOString();
  const head = records.map((r) => JSON.stringify({ ts: now, ...r })).join('\n') + '\n';
  
  // 检查原文件是否存在
  let fileExists = false;
  try {
    await fs.access(filePath);
    fileExists = true;
  } catch {
    // 文件不存在
  }
  
  if (!fileExists) {
    // 新文件，直接写入
    await fs.writeFile(filePath, head, { encoding: 'utf-8' });
  } else {
    // 使用临时文件进行原子操作
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    try {
      // 写入新内容到临时文件
      await fs.writeFile(tempPath, head, { encoding: 'utf-8' });
      
      // 追加原文件内容
      const readStream = createReadStream(filePath);
      const writeStream = createWriteStream(tempPath, { flags: 'a' });
      
      await new Promise<void>((resolve, reject) => {
        readStream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        readStream.on('error', reject);
      });
      
      // 原子替换
      await fs.rename(tempPath, filePath);
    } catch (err) {
      // 清理临时文件
      try {
        await fs.unlink(tempPath);
      } catch {
        // 忽略清理失败
      }
      throw err;
    }
  }
}

// 基于 uid 去重并插入到文件头部：
// - 假设 records 按时间从新到旧排列（与文件一致）
// - 读取现有文件第一条的 uid（若存在），仅写入遇到该 uid 之前的新增记录
// - 返回最终写入的条数
export async function prependJsonlUniqueByUid(
  filePath: string,
  records: Array<JsonObject & { uid: string }>,
  options?: AppendJsonlOptions
): Promise<number> {
  const first = await readFirstJsonl(filePath);
  let existingUid: string | undefined = undefined;
  if (first && typeof first === 'object') {
    const v: unknown = (first as Record<string, unknown>)['uid'];
    if (typeof v === 'string') existingUid = v;
  }
  const out: Array<JsonObject & { uid: string }> = [];
  for (const r of records) {
    if (existingUid && r.uid === existingUid) break; // 遇到已存在的第一条即停止
    out.push(r);
  }
  if (out.length === 0) return 0;
  await prependJsonl(filePath, out, options);
  return out.length;
}
