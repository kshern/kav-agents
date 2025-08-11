import { appendFile, mkdir, open, rm, stat, writeFile as fsWriteFile } from "fs/promises";
import path from "path";

// 按文件路径维护的写入队列，确保同一文件的写入按顺序执行
const writeQueues = new Map<string, Promise<unknown>>();

// 按 key 维护的互斥执行队列，用于包裹“检查-写入”等需原子性的临界区
const exclusiveQueues = new Map<string, Promise<unknown>>();

/**
 * 追加一行 JSON 到 JSONL 文件（每行一条 JSON），保证同一文件在本进程内按顺序写入。
 * 会自动创建父目录。
 */
export async function appendJSONL<T>(filePath: string, record: T): Promise<void> {
  const dir = path.dirname(filePath);
  const prev = writeQueues.get(filePath) ?? Promise.resolve();
  const task = prev
    .catch(() => {})
    .then(async () => {
      // 确保目录存在
      await mkdir(dir, { recursive: true });
      // 追加写入一行，末尾加换行符
      const line = JSON.stringify(record) + "\n";
      await appendFile(filePath, line, "utf-8");
    });
  // 追踪任务，完成后若队首仍是自身则清理，避免内存泄漏
  writeQueues.set(filePath, task.finally(() => {
    if (writeQueues.get(filePath) === task) writeQueues.delete(filePath);
  }));
  return task as Promise<void>;
}

// 文件级别的跨进程互斥锁选项
export interface FileLockOptions {
  // 获取锁失败时的重试次数
  retries?: number;
  // 每次重试间隔毫秒
  retryDelayMs?: number;
  // 认为锁文件过期的阈值（毫秒），过期后会尝试移除陈旧锁
  staleMs?: number;
}

/**
 * 基于 lock 文件的简单文件互斥锁，实现跨进程互斥。
 * 通过原子方式创建 "<file>.lock"（open 'wx'）获取锁，执行完回调后删除锁。
 * 若锁已存在：按重试策略等待，或检测为陈旧锁后清理再重试。
 * 注意：该方案为协作式锁，若进程崩溃可能残留锁文件，需通过 staleMs 回收。
 */
export async function withFileLock<R>(filePath: string, fn: () => Promise<R>, opts: FileLockOptions = {}): Promise<R> {
  const { retries = 50, retryDelayMs = 50, staleMs = 60_000 } = opts;
  const lockPath = `${filePath}.lock`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 以独占模式创建锁文件，若已存在将抛出错误
      const fh = await open(lockPath, "wx");
      try {
        // 写入元数据（便于排查问题）
        const meta = { pid: process.pid, ts: new Date().toISOString(), file: filePath };
        await fsWriteFile(fh, JSON.stringify(meta), { encoding: "utf-8" });
      } catch {
        // 忽略写入元数据失败
      } finally {
        await fh.close();
      }
      try {
        // 持有锁，执行用户函数
        const result = await fn();
        return result;
      } finally {
        // 释放锁（容错：即使删除失败也不抛出以避免影响主流程）
        try {
          await rm(lockPath, { force: true });
        } catch {
          // ignore
        }
      }
    } catch (e: unknown) {
      // 如果创建失败，可能因为存在锁文件
      try {
        const s = await stat(lockPath);
        const age = Date.now() - s.mtimeMs;
        if (age > staleMs) {
          // 认为锁陈旧，尝试清理
          await rm(lockPath, { force: true });
          // 下一轮立即重试
          continue;
        }
      } catch {
        // 无法 stat，可能刚被释放，继续重试
      }
      if (attempt === retries) throw new Error(`获取文件锁失败：${lockPath}`);
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }
  // 理论不可达
  throw new Error(`获取文件锁失败：${lockPath}`);
}

/**
 * 在给定 key 上串行执行传入的异步函数，确保同一 key 的函数不会并发执行。
 * 适合用作“读取校验 -> 写入”的临界区，避免竞态导致的重复写入或约束冲突。
 */
export async function runExclusive<R>(key: string, fn: () => Promise<R>): Promise<R> {
  const prev = exclusiveQueues.get(key) ?? Promise.resolve();
  let resolveFn: (v: unknown) => void;
  let rejectFn: (e: unknown) => void;
  const gate = new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  const chained = prev
    .catch(() => {})
    .then(async () => {
      try {
        const result = await fn();
        resolveFn!(result);
      } catch (e) {
        rejectFn!(e);
      }
    });
  exclusiveQueues.set(key, chained.finally(() => {
    if (exclusiveQueues.get(key) === chained) exclusiveQueues.delete(key);
  }));
  return gate as Promise<R>;
}

/**
 * 别名：语义化命名，表明这是 JSONL 文件写入相关的文件锁
 */
export const withJSONLFileLock = withFileLock;

/**
 * 线程/进程安全的 JSONL 追加写入：内部自动获取文件锁再调用 appendJSONL
 * 适用于纯“追加一行”的场景，调用方无需关心锁的细节。
 */
export async function appendJSONLSafe<T>(filePath: string, record: T, opts: FileLockOptions = {}): Promise<void> {
  await withFileLock(filePath, async () => {
    await appendJSONL(filePath, record);
  }, opts);
}
