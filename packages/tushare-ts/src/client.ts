import { setTimeout as delay } from 'node:timers/promises';
import type {
  ITushareClient,
  TushareConfig,
  TushareParams,
  TushareRawResponse,
} from './types';

// 基于 TuShare Pro API 的轻量客户端实现
// - 含：鉴权（token）、POST 封装、错误处理
// - 含：指数退避重试、固定窗口速率限制、内存缓存（可选）
// - 设计为无框架依赖，未来可直接被 MCP server 复用

// fetch 函数签名（避免使用 any）
type HttpFetch = (
  input: string | URL,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<unknown>;
}>;

// 获取全局 fetch（Node 18+ 原生支持）；若缺失则给出清晰错误提示
function getFetch(): HttpFetch {
  if (typeof (globalThis as unknown as { fetch?: unknown }).fetch === 'function') {
    return (globalThis as unknown as { fetch: HttpFetch }).fetch;
  }
  throw new Error(
    '当前运行环境缺少 fetch，请使用 Node 18+ 或在外部提供 fetch polyfill（例如 undici）。',
  );
}

export class TushareClient implements ITushareClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly retries: { retries: number; minDelayMs: number; maxDelayMs: number };
  private readonly rateLimit: { maxRequests: number; perSeconds: number };
  private readonly cache?: { enabled: boolean; ttlMs: number };
  private readonly httpFetch: HttpFetch;

  // 简单固定窗口计数器（便于实现，满足多数个人/开发场景）
  private windowStart = 0;
  private windowCount = 0;

  // 内存缓存（key -> { expire, data }）
  private readonly memoryCache: Map<string, { expire: number; data: unknown }> = new Map();

  constructor(cfg: TushareConfig) {
    this.baseUrl = cfg.baseUrl ?? 'http://api.tushare.pro';
    this.token = cfg.token;
    this.timeoutMs = cfg.timeoutMs ?? 30_000;
    this.retries = cfg.retries ?? { retries: 2, minDelayMs: 500, maxDelayMs: 3_000 };
    this.rateLimit = cfg.rateLimit ?? { maxRequests: 50, perSeconds: 60 };
    this.cache = cfg.cache ?? { enabled: true, ttlMs: 10_000 }; // 默认开启 10s 短缓存
    this.httpFetch = getFetch();
  }

  // 对外统一调用入口：传入 apiName/params/fields，返回强类型对象数组
  async call<T extends object>(args: {
    apiName: string;
    params?: TushareParams;
    fields?: readonly string[];
    useCache?: boolean;
  }): Promise<T[]> {
    const { apiName, params, fields, useCache } = args;
    const cacheAllowed = this.cache?.enabled === true && (useCache ?? true);

    // 生成缓存键（包含 api、参数与字段）
    const cacheKey = cacheAllowed
      ? JSON.stringify({ apiName, params: params ?? {}, fields: fields ?? [] })
      : '';

    if (cacheAllowed && cacheKey) {
      const hit = this.memoryCache.get(cacheKey);
      if (hit && hit.expire > Date.now()) {
        return hit.data as T[];
      } else if (hit) {
        this.memoryCache.delete(cacheKey);
      }
    }

    // 速率限制：固定窗口计数，超过则等待至下个窗口
    await this.enforceRateLimit();

    // 指数退避重试
    let attempt = 0;
    let lastError: unknown;
    while (attempt <= this.retries.retries) {
      try {
        const result = await this.requestOnce<T>({ apiName, params, fields });
        // 写入缓存
        if (cacheAllowed && cacheKey && this.cache) {
          this.memoryCache.set(cacheKey, {
            expire: Date.now() + this.cache.ttlMs,
            data: result,
          });
        }
        return result;
      } catch (err) {
        lastError = err;
        if (attempt === this.retries.retries) break;
        const backoff = this.backoffDelay(attempt);
        await delay(backoff);
        attempt += 1;
      }
    }

    throw lastError;
  }

  // 单次请求执行：封装 TuShare Pro 的 POST JSON 协议
  private async requestOnce<T extends object>(args: {
    apiName: string;
    params?: TushareParams;
    fields?: readonly string[];
  }): Promise<T[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const body: Record<string, unknown> = {
        api_name: args.apiName,
        token: this.token,
        params: args.params ?? {},
      };
      if (args.fields && args.fields.length > 0) {
        // TuShare 支持以逗号分隔的字符串传入字段
        body.fields = args.fields.join(',');
      }

      const resp = await this.httpFetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!resp.ok) {
        // HTTP 层错误直接抛出，交由上层重试策略处理
        throw new Error(`TuShare HTTP ${resp.status}: ${resp.statusText}`);
      }

      const raw = (await resp.json()) as TushareRawResponse;
      if (raw.code !== 0) {
        // TuShare 业务错误，抛出至上层按策略重试
        throw new Error(`TuShare Error ${raw.code}: ${raw.msg}`);
      }

      // 将二维数组映射为对象数组（按 fields 对齐）
      const fields = raw.data.fields;
      const items = raw.data.items;
      const result: T[] = items.map((row) => {
        const obj: Record<string, unknown> = {};
        for (let i = 0; i < fields.length; i += 1) {
          obj[fields[i]] = row[i] ?? null;
        }
        return obj as T;
      });
      return result;
    } finally {
      clearTimeout(timeout);
    }
  }

  // 简单固定窗口速率限制
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const windowMs = this.rateLimit.perSeconds * 1000;
    if (now - this.windowStart >= windowMs) {
      // 新窗口，重置计数
      this.windowStart = now;
      this.windowCount = 0;
    }

    if (this.windowCount < this.rateLimit.maxRequests) {
      this.windowCount += 1;
      return;
    }

    const waitMs = this.windowStart + windowMs - now;
    if (waitMs > 0) {
      await delay(waitMs);
      // 进入新窗口并计一次
      this.windowStart = Date.now();
      this.windowCount = 1;
    }
  }

  // 指数退避延迟计算（含上限）
  private backoffDelay(attempt: number): number {
    const { minDelayMs, maxDelayMs } = this.retries;
    const expo = Math.min(maxDelayMs, minDelayMs * 2 ** attempt);
    // 加少量抖动，避免惊群
    const jitter = Math.floor(Math.random() * Math.max(1, Math.floor(expo * 0.2)));
    return Math.min(maxDelayMs, expo + jitter);
  }
}

// 基于环境变量创建客户端的便捷函数
// - 默认从 TUSHARE_TOKEN 读取令牌
// - 可通过 tokenEnvKey 指定其他变量名
export function createClientFromEnv(
  overrides?: Partial<Omit<TushareConfig, 'token'>> & { tokenEnvKey?: string },
): TushareClient {
  const envKey = overrides?.tokenEnvKey ?? 'TUSHARE_TOKEN';
  const token = process.env[envKey];
  if (!token) {
    throw new Error(`环境变量 ${envKey} 未设置`);
  }
  const cfg: TushareConfig = {
    token,
    baseUrl: overrides?.baseUrl,
    timeoutMs: overrides?.timeoutMs,
    retries: overrides?.retries,
    rateLimit: overrides?.rateLimit,
    cache: overrides?.cache,
  };
  return new TushareClient(cfg);
}
