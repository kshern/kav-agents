# packages/core/src/models/gateway.ts

## 概述

- 文件职责：模型网关。根据 `Model.provider` 将生成请求分发到不同模型服务（Google Gemini、OpenAI、OpenRouter）。
- 上下文/模块：位于 `models/`，被能力与流水线统一调用以屏蔽具体厂商差异。

## 位置与命名

- 相对路径：`packages/core/src/models/gateway.ts`
- 同名文档：同目录下同名 .md

## 导出清单

### function generateContent

- 形态: function (async)
- 签名: `({ modelConfig, prompt }: { modelConfig: Model; prompt: string }) => Promise<string>`
- 行为:
  - 根据 `modelConfig.provider` 分发：
    - `"google"` → `generateGeminiContent`
    - `"openai"` → `generateOpenaiContent`
    - `"openrouter"` → `generateOpenRouterContent`
  - 其他值：抛出 `Error("Unknown model provider: ...")`

## 主要依赖

- 外部依赖(0)：无
- 本地依赖(4)：`../types`（`Model` 类型）、`./gemini`、`./openai`、`./openrouter`

## 输入 / 输出

- 输入
  - `modelConfig: Model`（至少包含 `provider: "google" | "openai" | "openrouter"`、`model_name: string`、`api_key: string`）
  - `prompt: string`
- 输出
  - `Promise<string>`：生成的文本内容
- 异常
  - `Unknown model provider`：当 `provider` 不在支持列表中

## 使用示例

```ts
import { generateContent } from "./gateway";
import type { Model } from "../types";

const modelConfig: Model = {
  provider: "openai",
  model_name: "gpt-4o-mini",
  api_key: process.env.OPENAI_API_KEY!,
};

const text = await generateContent({ modelConfig, prompt: "Summarize quarterly results." });
console.log(text);
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.513Z
- 人工更新：2025-08-17T01:11:14+08:00
