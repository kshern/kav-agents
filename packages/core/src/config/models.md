# packages/core/src/config/models.ts

## 概述

- 文件职责：提供模型配置的兼容层，转发到集中式解析器 `pipeline/modelResolver`；并导出 `PROVIDER_API_KEYS` 环境变量映射。
- 上下文/模块：位于 `config/`，兼容旧导入路径，统一模型默认值与 API Key 注入的单一真源。

## 位置与命名

- 相对路径：`packages/core/src/config/models.ts`
- 同名文档：同目录下同名 .md

## 导出清单

- `type AbilityKey`（re-export）
  - 来自 `../pipeline/modelResolver`
- `function getModelConfig`（re-export）
  - 从 `../pipeline/modelResolver` 透传默认模型解析逻辑
- `function mergeModelConfig`（re-export）
  - 从 `../pipeline/modelResolver` 透传用户覆盖合并逻辑
- `const PROVIDER_API_KEYS: Record<string, string | undefined>`
  - 提供各 Provider 的 API Key 环境变量映射：
    - `openrouter: process.env.OPENROUTER_API_KEY`
    - `openai: process.env.OPENAI_API_KEY`
    - `google/gemini: process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY`
    - `anthropic: process.env.ANTHROPIC_API_KEY`

参见：`packages/core/src/pipeline/modelResolver.md` 获取 `getModelConfig` 与 `mergeModelConfig` 的详细签名与行为说明。

## 主要依赖

- 外部依赖：无
- 本地依赖：`../pipeline/modelResolver`

## 输入 / 输出

- 输入
  - 使用者通过从该模块导入函数/类型获取模型配置能力与 API Key 映射
- 输出
  - `AbilityKey` 类型、`getModelConfig`/`mergeModelConfig` 函数（re-export）
  - `PROVIDER_API_KEYS` 常量（用于运行时读取环境配置）

## 使用示例

```ts
import { getModelConfig, mergeModelConfig, PROVIDER_API_KEYS } from "../config/models";

// 读取默认模型配置（按能力）
const base = getModelConfig({ ability: "MarketAnalyst" });

// 合并用户自定义
const finalCfg = mergeModelConfig(base, { model_name: "gpt-4o-mini" });

// 访问 Provider 环境变量
const openaiKey = PROVIDER_API_KEYS.openai;
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.493Z
- 人工更新：2025-08-17T01:11:14+08:00
