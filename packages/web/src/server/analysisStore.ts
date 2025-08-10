import { mkdir, appendFile, readFile } from "fs/promises";
import path from "path";

export type AnalysisEventType = "started" | "progress" | "final" | "error" | "aborted";

export interface StoredLine<T = unknown> {
  analysisId: string;
  symbol: string;
  ts: string; // ISO timestamp
  payload: { type: AnalysisEventType; event?: T } | { type: "aborted" };
}

const DATA_DIR = "data";

function getDataDir() {
  return path.resolve(process.cwd(), DATA_DIR);
}

function getFilePath(analysisId: string) {
  return path.join(getDataDir(), `${analysisId}.jsonl`);
}

export async function ensureDataDir() {
  await mkdir(getDataDir(), { recursive: true });
}

export async function appendEvent<T = unknown>(
  analysisId: string,
  symbol: string,
  type: AnalysisEventType,
  event?: T,
  ts: string = new Date().toISOString(),
) {
  await ensureDataDir();
  const line: StoredLine<T> = {
    analysisId,
    symbol,
    ts,
    payload: type === "aborted" ? { type } : { type, event },
  };
  await appendFile(getFilePath(analysisId), JSON.stringify(line) + "\n", "utf-8");
}

export async function readEvents<T = unknown>(analysisId: string): Promise<StoredLine<T>[]> {
  try {
    const buf = await readFile(getFilePath(analysisId), "utf-8");
    const lines = buf.split(/\r?\n/);
    const out: StoredLine<T>[] = [];
    for (const l of lines) {
      if (!l.trim()) continue;
      try {
        out.push(JSON.parse(l));
      } catch {
        // ignore bad line
      }
    }
    return out;
  } catch {
    return [];
  }
}
