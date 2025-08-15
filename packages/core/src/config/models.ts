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
 * 从环境变量读取并覆盖模型配置（按前缀分类）
 * 环境变量键格式：
 * - `${prefix}_PROVIDER`
 * - `${prefix}_MODEL`
 * - `${prefix}_API_KEY`
 * - `${prefix}_BASE_URL`
 * 例如：LLM_NEWS_MODEL、LLM_NEWS_PROVIDER ...
 */
function modelFromEnv(prefix: string, fallback: Model): Model {
  // 为每个能力生成独立对象，避免引用共享
  const base: Model = { ...fallback };
  const provider = process.env[`${prefix}_PROVIDER`];
  const modelName = process.env[`${prefix}_MODEL`];
  const apiKey = process.env[`${prefix}_API_KEY`];
  const baseUrl = process.env[`${prefix}_BASE_URL`];
  return {
    provider: provider || base.provider,
    model_name: modelName || base.model_name,
    api_key: apiKey || base.api_key,
    base_url: baseUrl || base.base_url,
  };
}

/**
 * 每个能力的默认模型配置映射
 * 说明：当前全部指向相同默认模型，保留按能力差异化的能力以便未来细化。
 */
export const abilityModelConfigs = {
  // 分析类能力：支持通过环境变量独立覆盖
  // 例：LLM_FUNDAMENTALS_MODEL / LLM_FUNDAMENTALS_PROVIDER / LLM_FUNDAMENTALS_API_KEY / LLM_FUNDAMENTALS_BASE_URL
  fundamentalsAnalyst: modelFromEnv("LLM_FUNDAMENTALS", defaultModel()),
  marketAnalyst: modelFromEnv("LLM_MARKET", defaultModel()),
  newsAnalyst: modelFromEnv("LLM_NEWS", defaultModel()),
  socialMediaAnalyst: modelFromEnv("LLM_SOCIAL", defaultModel()),
  // 研究员与辩手/经理/交易员：同理可分别定制
  bullResearcher: modelFromEnv("LLM_BULL_RESEARCHER", defaultModel()),
  bearResearcher: modelFromEnv("LLM_BEAR_RESEARCHER", defaultModel()),
  researchManager: modelFromEnv("LLM_RESEARCH_MANAGER", defaultModel()),
  trader: modelFromEnv("LLM_TRADER", defaultModel()),
  debateAggressive: modelFromEnv("LLM_DEBATE_AGGRESSIVE", defaultModel()),
  debateNeutral: modelFromEnv("LLM_DEBATE_NEUTRAL", defaultModel()),
  debateConservative: modelFromEnv("LLM_DEBATE_CONSERVATIVE", defaultModel()),
  riskManager: modelFromEnv("LLM_RISK_MANAGER", defaultModel()),
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
