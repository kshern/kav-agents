# packages/core/src/models/openai.ts

## 概述

- 文件职责：封装使用 OpenAI（含兼容 GitHub Models baseURL）生成文本内容。
- 上下文/模块：位于 `models/`，由 `models/gateway.ts` 按 `provider: "openai"` 调用。

## 位置与命名

- 相对路径：`packages/core/src/models/openai.ts`
- 同名文档：同目录下同名 .md

## 导出清单

### function generateOpenaiContent

- 形态: function (async)
- 签名: `({ modelConfig, prompt }: { modelConfig: Model; prompt: string }) => Promise<string>`
- 行为:
  - 创建 `OpenAI` 客户端：
    - `baseURL = modelConfig.base_url || "https://models.github.ai/inference/chat/completions"`
    - `apiKey = modelConfig.api_key || process.env.GITHUB_TOKEN`
  - 调用 `openai.chat.completions.create({ model: model_name, messages: [{ role: "user", content: prompt }] })`
  - 返回 `choices[0].message.content || ""`

## 主要依赖

- 外部依赖(1)：`openai`
- 本地依赖(1)：`../types`（`Model` 类型）

## 输入 / 输出

- 输入
  - `modelConfig: Model`（需包含 `model_name`、`api_key` 或依赖环境变量；可选 `base_url`）
  - `prompt: string`
- 输出
  - `Promise<string>`：模型生成的文本
- 异常
  - 当网络或鉴权失败时由 SDK 抛出；本函数未做捕获

## 使用示例

```ts
import { generateOpenaiContent } from "./openai";
import type { Model } from "../types";

const modelConfig: Model = {
  provider: "openai",
  model_name: "gpt-4o-mini",
  api_key: process.env.OPENAI_API_KEY!,
};

const text = await generateOpenaiContent({ modelConfig, prompt: "Draft a concise market update." });
console.log(text);
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.515Z
- 人工更新：2025-08-17T01:11:14+08:00
