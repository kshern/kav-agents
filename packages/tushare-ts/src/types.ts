// TuShare TS 类型定义（严格模式，不使用 any），带中文注释，便于后续 MCP 封装复用

// 支持的 HTTP 方法（TuShare Pro 使用 POST）
export type HttpMethod = 'POST';

// TuShare 客户端配置
export interface TushareConfig {
  // TuShare Pro API 基地址，默认 http://api.tushare.pro
  baseUrl?: string;
  // 访问令牌，建议从环境变量 TUSHARE_TOKEN 注入
  token: string;
  // 速率限制配置（简单令牌桶实现）
  rateLimit?: {
    maxRequests: number; // 每窗口最大请求数
    perSeconds: number; // 窗口秒数
  };
  // 单次请求超时
  timeoutMs?: number;
  // 重试配置（指数退避）
  retries?: {
    retries: number; // 最大重试次数（不含首发）
    minDelayMs: number; // 最小退避
    maxDelayMs: number; // 最大退避
  };
  // 简易内存缓存配置
  cache?: {
    enabled: boolean; // 是否开启缓存
    ttlMs: number; // 过期时间（毫秒）
  };
}

// TuShare 原始响应结构（字段+二维数组）
export interface TushareRawResponse {
  code: number;
  msg: string;
  data: {
    fields: string[];
    items: (string | number | null)[][];
  };
}

// TuShare 通用参数类型（限制在基础类型，便于序列化）
export type TushareParams = Record<string, string | number | boolean | null | undefined>;

// TuShare 客户端公共接口定义
export interface ITushareClient {
  call<T extends object>(args: {
    apiName: string; // TuShare 接口名，例如 'daily'
    params?: TushareParams; // 参数对象
    fields?: readonly string[]; // 需要的字段列表（可选）
    useCache?: boolean; // 是否使用缓存（默认 true 且全局允许时生效）
  }): Promise<T[]>; // 返回强类型对象数组
}

// 日线行情（daily）字段类型定义（常用字段，非完整集）
export interface DailyRecord {
  ts_code?: string; // 证券代码
  trade_date?: string; // 交易日期 YYYYMMDD
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  pre_close?: number;
  change?: number;
  pct_chg?: number;
  vol?: number; // 成交量（手）
  amount?: number; // 成交额（千元）
}

export interface DailyParams extends TushareParams {
  ts_code?: string; // 证券代码
  trade_date?: string; // 交易日期
  start_date?: string; // 开始日期
  end_date?: string; // 结束日期
}

// 基础信息（stock_basic）字段类型定义（常用字段）
export interface StockBasicRecord {
  ts_code?: string;
  symbol?: string;
  name?: string;
  area?: string;
  industry?: string;
  fullname?: string;
  enname?: string;
  cnspell?: string;
  exchange?: string;
  curr_type?: string;
  list_status?: string;
  list_date?: string;
  delist_date?: string | null;
  is_hs?: string;
}

export interface StockBasicParams extends TushareParams {
  is_hs?: string;
  list_status?: 'L' | 'D' | 'P';
  exchange?: 'SSE' | 'SZSE' | 'BSE';
  market?: string;
  ts_code?: string;
}
