/**
 * @file 模型网关
 * @description 根据模型名称，将请求分发到不同的模型服务。
 */
import { Model } from "../types";
import { generateGeminiContent } from "./gemini";
import { generateOpenaiContent } from "./openai";
import { generateOpenRouterContent } from "./openrouter";

/**
 * 使用指定的模型生成内容。
 *
 * @param {object} params - 参数对象。
 * @param {Model} params.modelConfig - 用于生成内容的模型配置。
 * @param {string} params.prompt - 提供给模型的提示。
 * @returns {Promise<string>} - 返回一个包含生成内容的对象。
 */
export async function generateContent({
  modelConfig,
  prompt,
}: {
  modelConfig: Model;
  prompt: string;
}): Promise<string> {
  // 根据 provider 字段分发到对应的模型服务
  switch (modelConfig.provider) {
    case "google":
      return generateGeminiContent({ modelConfig, prompt });
    case "openai":
      return generateOpenaiContent({ modelConfig, prompt });
    case "openrouter":
      return generateOpenRouterContent({ modelConfig, prompt });
    default:
      return generateOpenRouterContent({ modelConfig, prompt });
  }
}
