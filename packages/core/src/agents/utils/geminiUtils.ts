/**
 * @file Gemini 模型工具
 * @description 提供了用于创建和配置 Google Gemini 模型的辅助函数。
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

/**
 * 创建并返回一个配置好的 Gemini GenerativeModel 实例。
 *
 * @param apiKey - 你的 Google AI API 密钥。
 * @param modelName - 要使用的模型名称 (例如, 'gemini-1.5-flash')。
 * @param systemPrompt - (可选) 要提供给模型的系统级指令。
 * @param generationConfig - (可选) 生成内容的配置选项。
 * @returns - 返回一个 GenerativeModel 实例。
 */
export function createModel(
  apiKey: string,
  modelName: string = 'gemini-1.5-flash',
  systemPrompt?: string,
  generationConfig?: GenerationConfig
): GenerativeModel {
  const genAI = new GoogleGenerativeAI(apiKey);

  const modelParams: { model: string; systemInstruction?: any, generationConfig?: GenerationConfig } = {
    model: modelName,
  };

  if (systemPrompt) {
    modelParams.systemInstruction = {
      role: 'system',
      parts: [{ text: systemPrompt }],
    };
  }

  if (generationConfig) {
    modelParams.generationConfig = generationConfig;
  }

  return genAI.getGenerativeModel(modelParams);
}
