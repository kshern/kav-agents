/**
 * @file 集中式模型配置
 * 为各个能力（ability）提供默认模型配置，并提供获取与合并工具。
 */
import type { Model } from "../types";

/**
 * 默认模型配置构造器（避免在对象字面量中重复书写 env）
 */
function defaultModel(): Model {
  return {
    provider: "openrouter",
    model_name: "z-ai/glm-4.5-air:free",
    api_key: process.env.OPENROUTER_API_KEY,
  };
}

/**
 * 每个能力的默认模型配置映射
 * 说明：提供静态默认；实际生效由编排层合并步骤/分组/成员/运行时覆盖确定。
 */
export const abilityModelConfigs = {
  // 分析类能力
  fundamentalsAnalyst: defaultModel(),
  marketAnalyst: defaultModel(),
  newsAnalyst: defaultModel(),
  socialMediaAnalyst: defaultModel(),
  // 研究员与辩手/经理/交易员
  bullResearcher: defaultModel(),
  bearResearcher: defaultModel(),
  researchManager: defaultModel(),
  trader: defaultModel(),
  debateAggressive: defaultModel(),
  debateNeutral: defaultModel(),
  debateConservative: defaultModel(),
  riskManager: defaultModel(),
} as const;

/**
 * 能力键类型（由映射自动推导，避免硬编码）
 */
export type AbilityKey = keyof typeof abilityModelConfigs;

/**
 * 获取能力默认模型配置
 * @param abilityKey 能力键
 * @returns 该能力的默认模型配置（深拷贝，避免引用共享）
 */
export function getModelConfig(abilityKey: AbilityKey): Model {
  const base = abilityModelConfigs[abilityKey] ?? defaultModel();
  // 返回浅拷贝，避免上层意外修改默认表
  return { ...base };
}

/**
 * 合并模型配置（右侧覆盖左侧）
 * @param base 基准模型配置
 * @param override 可选的覆盖（Partial）
 * @returns 合并后的模型配置
 */
export function mergeModelConfig(
  base: Model,
  override?: Partial<Model>,
): Model {
  if (!override) return base;
  const merged: Model = { ...base };
  if (override.provider) merged.provider = override.provider;
  if (override.model_name) merged.model_name = override.model_name;
  if (override.api_key) merged.api_key = override.api_key;
  if (override.base_url) merged.base_url = override.base_url;
  return merged;
}
