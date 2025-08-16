import { PROVIDER_API_KEYS } from "../config/models";
import type { Model } from "../types";

// 能力键统一类型，便于集中配置默认模型
export type AbilityKey =
  | "fundamentalsAnalyst"
  | "marketAnalyst"
  | "newsAnalyst"
  | "socialMediaAnalyst"
  | "bullResearcher"
  | "bearResearcher"
  | "researchManager"
  | "trader"
  | "debateAggressive"
  | "debateNeutral"
  | "debateConservative"
  | "riskManager";



// 自动填充缺省的 api_key（若映射中存在）
function ensureApiKey(model: Model): Model {
  if (!model.api_key) {
    const k = PROVIDER_API_KEYS[model.provider];
    if (k) return { ...model, api_key: k };
  }
  return model;
}

// 默认模型配置（可按需调整）
const DEFAULT_MODELS: Record<AbilityKey, Model> = {
  fundamentalsAnalyst: { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" },
  marketAnalyst: { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" },
  newsAnalyst: { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" },
  socialMediaAnalyst: { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" },
  bullResearcher: { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" },
  bearResearcher: { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" },
  researchManager: { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" },
  trader: { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" },
  debateAggressive: { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" },
  debateNeutral: { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" },
  debateConservative: { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" },
  riskManager: { provider: "openrouter", model_name: "z-ai/glm-4.5-air:free" },
};

// 获取按能力的默认模型配置
export function getModelConfig(ability: AbilityKey): Model {
  return ensureApiKey(DEFAULT_MODELS[ability]);
}

// 合并模型配置（后者覆盖前者）
export function mergeModelConfig(base: Model, override?: Partial<Model>): Model {
  if (!override) return ensureApiKey(base);
  const merged = { ...base, ...override } as Model;
  return ensureApiKey(merged);
}
