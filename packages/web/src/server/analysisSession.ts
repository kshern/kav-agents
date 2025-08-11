import { mkdir, readFile } from "fs/promises";
import path from "path";
import { appendJSONLSafe } from "@/server/utils/jsonl";

// 会话元数据存储（JSONL）：将 analysisId -> symbol 以行式 JSON 记录持久化到单个文件 data/sessions.jsonl
// 说明：
// - 与现有文件落地风格一致，避免引入外部依赖
// - 使用单一 JSONL 文件，减少文件数量，每条记录形如 { analysisId, symbol, ts }
// - 读取时按行扫描，返回匹配 analysisId 的最新一条记录的 symbol

const DATA_DIR = "data";
const SESSIONS_FILENAME = "sessions.jsonl";

function getSessionsFilePath(): string {
  // 使用工作目录下 data/sessions.jsonl
  return path.resolve(process.cwd(), DATA_DIR, SESSIONS_FILENAME);
}

export interface SessionRecord {
  analysisId: string;
  symbol: string;
  ts: string; // ISO 时间戳
}

export async function ensureSessionDir(): Promise<void> {
  // 仅确保 data 目录存在
  await mkdir(path.resolve(process.cwd(), DATA_DIR), { recursive: true });
}

// 保存（追加）某个会话的 symbol 到 JSONL
export async function saveSessionSymbol(analysisId: string, symbol: string): Promise<void> {
  await ensureSessionDir();
  const record: SessionRecord = {
    analysisId,
    symbol,
    ts: new Date().toISOString(),
  };
  // 以换行分隔的 JSON 追加模式：若文件不存在，writeFile 会创建；此处采用 append 语义
  // 注意：fs/promises 的 writeFile 不直接提供 append 选项，使用 'a' 标志以追加
  const filePath = getSessionsFilePath();
  // 使用封装的安全追加方法，内部包含跨进程文件锁
  await appendJSONLSafe(filePath, record);
}

// 读取某个会话的 symbol（若不存在返回 undefined）
export async function readSessionSymbol(analysisId: string): Promise<string | undefined> {
  try {
    const buf = await readFile(getSessionsFilePath(), "utf-8");
    // 按行解析，查找最后一个匹配的记录
    const lines = buf.split(/\r?\n/);
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line) continue;
      try {
        const json = JSON.parse(line) as Partial<SessionRecord>;
        if (json.analysisId === analysisId && typeof json.symbol === "string" && json.symbol.length > 0) {
          return json.symbol;
        }
      } catch {
        // 略过损坏的行，继续向上查找
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}
