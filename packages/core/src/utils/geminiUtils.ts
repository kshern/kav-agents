/**
 * @file Gemini 模型工具
 * @description 提供了用于创建和配置 Google Gemini 模型的辅助函数。
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Model } from "../types";

// 默认的 API 密钥，在没有提供时使用
// 注意：在生产环境中应使用环境变量
export const API_KEY = "AIzaSyB66lcLvrIz1fi5kQD9Xdf-pY01kk2gEKY";

/**
 * 使用指定的模型生成内容。
 *
 * @param modelConfig - 用于生成内容的模型配置。
 * @param prompt - 提供给模型的提示。
 * @returns - 返回一个包含生成内容的对象。
 */
export async function generateContent({
  modelConfig,
  prompt,
}: {
  modelConfig: Model;
  prompt: string;
}): Promise<string> {
  const model = new ChatGoogleGenerativeAI({
    apiKey: modelConfig.api_key || API_KEY,
    modelName: modelConfig.model_name,
  });

  const response = await model.invoke(prompt);

  // Ensure response.content is a string before returning
  if (typeof response.content === 'string') {
    return response.content;
  } else {
    // Handle cases where content might be an array of parts
    // This is a simple example; you might need more complex logic
    // depending on your expected response structure.
    return JSON.stringify(response.content);
  }
}
