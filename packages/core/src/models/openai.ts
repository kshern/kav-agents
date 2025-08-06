/**
 * @file OpenAI 模型工具
 * @description 提供了使用 OpenAI 模型生成内容的函数。
 */
import OpenAI from "openai";
import { Model } from "../types";

/**
 * 使用 OpenAI 模型生成内容。
 *
 * @param {object} params - 参数对象。
 * @param {Model} params.modelConfig - 用于生成内容的模型配置。
 * @param {string} params.prompt - 提供给模型的提示。
 * @returns {Promise<string>} - 返回一个包含生成内容的对象。
 */
export async function generateOpenaiContent({
  modelConfig,
  prompt,
}: {
  modelConfig: Model;
  prompt: string;
}): Promise<string> {
  const openai = new OpenAI({
    baseURL: "https://models.github.ai/inference/chat/completions",
    apiKey: modelConfig.api_key || process.env.GITHUB_TOKEN, // or any PAT with models:read
  });

  const res = await openai.chat.completions.create({
    model: modelConfig.model_name,
    messages: [{ role: "user", content: prompt }],
  });

  return res.choices[0].message.content || "";
}