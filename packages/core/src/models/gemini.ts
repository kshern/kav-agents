/**
 * @file Gemini 模型工具
 * @description 提供了使用 Google Gemini 模型生成内容的函数。
 */
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { Model } from "../types";

/**
 * 使用 Gemini 模型生成内容。
 *
 * @param {object} params - 参数对象。
 * @param {Model} params.modelConfig - 用于生成内容的模型配置。
 * @param {string} params.prompt - 提供给模型的提示。
 * @returns {Promise<string>} - 返回一个包含生成内容的对象。
 */
export async function generateGeminiContent({
  modelConfig,
  prompt,
}: {
  modelConfig: Model;
  prompt: string;
}): Promise<string> {
  const { text } = await generateText({
    model: google(modelConfig.model_name as any),
    tools: {
      google_search: google.tools.googleSearch({}),
    },
    prompt,
  });

  return text;
}
