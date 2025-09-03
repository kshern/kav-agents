// Tushare 适配器：在 datasources 中统一封装 SDK 的创建与调用
// 设计目标：
// 1) 仅服务端使用（依赖环境变量 TUSHARE_TOKEN）
// 2) 不假设具体 SDK 导出形态，通过运行时类型守卫适配不同版本
// 3) 返回结构保持通用：数组的记录对象（Record<string, unknown>）
import * as TushareSdk from '@tushare/sdk';

export interface TushareCallParams {
  // 调用参数（按 Tushare 接口定义的字段名与取值）
  [key: string]: string | number | boolean | null | undefined;
}

export interface TushareCallInput {
  // API 接口名称，例如："daily"、"stock_basic"
  api: string;
  // 查询参数
  params?: TushareCallParams;
  // 字段选择
  fields?: string[];
}

export type TushareRow = Record<string, unknown>;

export interface TushareAdapter {
  // 通用调用：返回记录对象数组
  call(input: TushareCallInput): Promise<TushareRow[]>;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isFunction(v: unknown): v is (...args: unknown[]) => unknown {
  return typeof v === 'function';
}

// 从环境变量解析令牌
function resolveToken(explicit?: string): string {
  const t = explicit ?? process.env.TUSHARE_TOKEN ?? '';
  if (!t) throw new Error('TUSHARE_TOKEN 未配置，请在环境变量或参数中提供');
  return t;
}

export async function createTushareAdapter(token?: string): Promise<TushareAdapter> {
  const resolvedToken = resolveToken(token);
  // 静态导入 SDK（Node-only 环境）
  const mod: unknown = TushareSdk;

  // 形态 1：有 createClient(token) 且返回 { call }
  if (isRecord(mod) && isFunction((mod as Record<string, unknown>)['createClient'])) {
    const cc = (mod as Record<string, unknown>)['createClient'];
    if (isFunction(cc)) {
      const client: unknown = cc(resolvedToken);
      if (isRecord(client) && isFunction(client['call'])) {
        const callFn = client['call'] as (input: TushareCallInput) => Promise<unknown>;
        return {
          async call(input: TushareCallInput): Promise<TushareRow[]> {
            const out = await callFn(input);
            // 尽量归一为对象数组
            if (Array.isArray(out)) return out.filter(isRecord) as TushareRow[];
            if (isRecord(out) && Array.isArray(out['data'])) {
              const data = out['data'];
              return Array.isArray(data) ? data.filter(isRecord) as TushareRow[] : [];
            }
            return [];
          },
        };
      }
    }
  }

  // 形态 2：默认导出可作为构造函数或工厂，且实例具有 call
  if (isRecord(mod) && mod['default'] !== undefined) {
    const def = (mod as Record<string, unknown>)['default'];
    if (isFunction(def)) {
      const maybe = def(resolvedToken);
      // 可能是工厂函数返回实例，也可能需要 new 调用；先尝试直接作为工厂
      if (isRecord(maybe) && isFunction(maybe['call'])) {
        const callFn = maybe['call'] as (input: TushareCallInput) => Promise<unknown>;
        return {
          async call(input: TushareCallInput): Promise<TushareRow[]> {
            const out = await callFn(input);
            if (Array.isArray(out)) return out.filter(isRecord) as TushareRow[];
            if (isRecord(out) && Array.isArray(out['data'])) {
              const data = out['data'];
              return Array.isArray(data) ? data.filter(isRecord) as TushareRow[] : [];
            }
            return [];
          },
        };
      }
      // 再尝试作为构造函数 new
      try {
        const Instance: new (tokenArg: string) => unknown = def as unknown as new (tokenArg: string) => unknown;
        const obj: unknown = new Instance(resolvedToken);
        if (isRecord(obj) && isFunction(obj['call'])) {
          const callFn = obj['call'] as (input: TushareCallInput) => Promise<unknown>;
          return {
            async call(input: TushareCallInput): Promise<TushareRow[]> {
              const out = await callFn(input);
              if (Array.isArray(out)) return out.filter(isRecord) as TushareRow[];
              if (isRecord(out) && Array.isArray(out['data'])) {
                const data = out['data'];
                return Array.isArray(data) ? data.filter(isRecord) as TushareRow[] : [];
              }
              return [];
            },
          };
        }
      } catch {
        // 忽略 new 失败，继续后续错误
      }
    }
  }

  throw new Error('无法适配 @tushare/sdk 的导出结构，请检查 SDK 版本或更新适配器');
}
