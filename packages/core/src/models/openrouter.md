# packages/core/src/models/openrouter.ts

## 概述

- 文件职责：封装使用 OpenRouter（OpenAI 兼容协议）生成文本内容。
- 上下文/模块：位于 `models/`，由 `models/gateway.ts` 按 `provider: "openrouter"` 调用。

## 位置与命名

- 相对路径：`packages/core/src/models/openrouter.ts`
- 同名文档：同目录下同名 .md

## 导出清单

### function generateOpenRouterContent

- 形态: function (async)
- 签名: `({ modelConfig, prompt }: { modelConfig: Model; prompt: string }) => Promise<string>`
- 行为:
  - 创建 `OpenAI` 客户端：
    - `baseURL = "https://openrouter.ai/api/v1"`
    - `apiKey = modelConfig.api_key || process.env.GITHUB_TOKEN`
    - `defaultHeaders = { "HTTP-Referer": "https://openrouter.ai/", "X-Title": "OpenRouter" }`
  - 调用 `openai.chat.completions.create({ model: model_name, messages: [{ role: "user", content: prompt }] })`
  - 返回 `choices[0].message.content || ""`

## 主要依赖

- 外部依赖(1)：`openai`
- 本地依赖(1)：`../types`（`Model` 类型）

## 输入 / 输出

- 输入
  - `modelConfig: Model`（需包含 `model_name`、`api_key` 或依赖环境变量）
  - `prompt: string`
- 输出
  - `Promise<string>`：模型生成的文本
- 兼容性提示
  - 该实现使用 OpenAI SDK 兼容 OpenRouter Chat Completions API

## 使用示例

```ts
import { generateOpenRouterContent } from "./openrouter";
import type { Model } from "../types";

const modelConfig: Model = {
  provider: "openrouter",
  model_name: "anthropic/claude-3.5-sonnet",
  api_key: process.env.OPENROUTER_API_KEY!,
};

const text = await generateOpenRouterContent({ modelConfig, prompt: "Summarize today’s macro events." });
console.log(text);
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.515Z
- 人工更新：2025-08-17T01:11:14+08:00
