/**
 * @file 兼容层：转发到新的集中式模型解析器 `pipeline/modelResolver`
 * 目的：保持旧导入路径不报错，同时统一单一真源，避免默认模型不一致。
 */
export type { AbilityKey } from "../pipeline/modelResolver";
export { getModelConfig, mergeModelConfig } from "../pipeline/modelResolver";

export const PROVIDER_API_KEYS: Record<string, string | undefined> = {
  openrouter: process.env.OPENROUTER_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  // Gemini 走 Google AI SDK，优先 GOOGLE_API_KEY，兼容 GEMINI_API_KEY
  google: process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY,
  gemini: process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
};
