import type { MemoryConfig } from "../types";

// 默认记忆策略（与 TradeAgent 内部默认保持一致）
export const DEFAULT_MEMORY: MemoryConfig = { strategy: "situation", topK: 2 };

// 合并记忆策略：优先级从左到右
function coalesceMemory(
  ...candidates: Array<MemoryConfig | undefined>
): MemoryConfig {
  for (const c of candidates) if (c) return c;
  return DEFAULT_MEMORY;
}

// 普通步骤的记忆解析：运行时覆盖 > 步骤级 > 全局默认
export function resolveStepMemory(
  runtimeOverride: MemoryConfig | undefined,
  stepMemory: MemoryConfig | undefined,
  globalDefault: MemoryConfig = DEFAULT_MEMORY
): MemoryConfig {
  return coalesceMemory(runtimeOverride, stepMemory, globalDefault);
}

// 辩论成员的记忆解析：运行时覆盖 > 成员级 > 分组级 > 全局默认
export function resolveDebateMemory(
  runtimeOverride: MemoryConfig | undefined,
  memberMemory: MemoryConfig | undefined,
  groupMemory: MemoryConfig | undefined,
  globalDefault: MemoryConfig = DEFAULT_MEMORY
): MemoryConfig {
  return coalesceMemory(runtimeOverride, memberMemory, groupMemory, globalDefault);
}
