# packages/core/src/models/gemini.ts

## 概述

- 文件职责：封装使用 Google Gemini 模型生成文本内容。
- 上下文/模块：位于 `models/`，由 `models/gateway.ts` 按 `provider: "google"` 调用。

## 位置与命名

- 相对路径：`packages/core/src/models/gemini.ts`
- 同名文档：同目录下同名 .md

## 导出清单

### function generateGeminiContent

- 形态: function (async)
- 签名: `({ modelConfig, prompt }: { modelConfig: Model; prompt: string }) => Promise<string>`
- 行为:
  - 调用 `generateText`（`ai` 包）并使用 `google(model_name)` 构建模型；内置 `google_search` 工具。
  - 返回 `text` 字段。
  - 侧效应：`console.log('google!!')` 调试日志。

## 主要依赖

- 外部依赖(2)：`@ai-sdk/google`、`ai`
- 本地依赖(1)：`../types`（`Model` 类型）

## 输入 / 输出

- 输入
  - `modelConfig: Model`（需包含 `model_name`；`api_key` 由 SDK/环境变量处理，网关/解析器会注入）
  - `prompt: string`
- 输出
  - `Promise<string>`：模型生成的文本
- 侧效应
  - 控制台调试日志 `google!!`

## 使用示例

```ts
import { generateGeminiContent } from "./gemini";
import type { Model } from "../types";

const modelConfig: Model = {
  provider: "google",
  model_name: "gemini-2.5-pro",
  api_key: process.env.GOOGLE_API_KEY!,
};

const text = await generateGeminiContent({ modelConfig, prompt: "List key market highlights." });
console.log(text);
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.514Z
- 人工更新：2025-08-17T01:11:14+08:00
