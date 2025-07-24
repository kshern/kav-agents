/**
 * @file Gemini 模型工具
 * @description 提供了用于创建和配置 Google Gemini 模型的辅助函数。
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// 默认的 API 密钥，在没有提供时使用
// 注意：在生产环境中应使用环境变量
export const API_KEY = "AIzaSyB66lcLvrIz1fi5kQD9Xdf-pY01kk2gEKY";

/**
 * 使用指定的模型生成内容。
 *
 * @param modelName - 用于生成内容的模型名称。
 * @param prompt - 提供给模型的提示。
 * @returns - 返回一个包含生成内容的对象。
 */
export async function generateContent({
  modelName,
  prompt,
}: {
  modelName: string;
  prompt: string;
}): Promise<string> {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const content = response.text();

  return content;
}
