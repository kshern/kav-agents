# packages/core/src/pipeline/modelResolver.ts
 
  ## 概述
 
 - 文件职责：按能力键返回默认模型配置，并合并/补全模型配置（自动注入提供商 API Key）。
 - 上下文/模块：隶属 `pipeline/` 子系统，被各能力与编排层统一获取模型配置。
 
  ## 位置与命名
 
  - 相对路径：`packages/core/src/pipeline/modelResolver.ts`
  - 同名文档：同目录下同名 .md
 
  ## 导出清单
 
  ### function getModelConfig
 
 - 形态: function
  - 名称: getModelConfig
 - 签名: `(ability: AbilityKey) => Model`
 - 行为: 根据能力键返回默认模型配置，并通过内部 `ensureApiKey()` 从 `PROVIDER_API_KEYS` 自动补全 `api_key`（若缺失）。
 
  ### function mergeModelConfig
 
 - 形态: function
  - 名称: mergeModelConfig
 - 签名: `(base: Model, override?: Partial<Model>) => Model`
 - 行为: 将 `override` 对 `base` 做浅合并（后者覆盖前者），并自动补全 `api_key`。
 
  ### type AbilityKey
 
 - 形态: type
  - 名称: AbilityKey
 - 取值：
   - `"fundamentalsAnalyst" | "marketAnalyst" | "newsAnalyst" | "socialMediaAnalyst" | "bullResearcher" | "bearResearcher" | "researchManager" | "trader" | "debateAggressive" | "debateNeutral" | "debateConservative" | "riskManager"`
 - 说明：集中声明能力键，便于维护默认模型映射表。
 
  ## 主要依赖
 
 - 外部依赖(0)：无
 - 本地依赖(2)：`../config/models`（`PROVIDER_API_KEYS`），`../types`（`Model`）
 
  ## 输入 / 输出
 
 - 输入
   - `ability: AbilityKey`（用于 `getModelConfig`）
   - `base: Model, override?: Partial<Model>`（用于 `mergeModelConfig`）
 - 输出
   - `Model`：包含 `provider`, `model_name`, `api_key?`, `base_url?`
 - 侧效应
   - 无显式副作用；但会从集中配置 `PROVIDER_API_KEYS` 注入 `api_key` 字段。
 
  ## 使用示例
 
 ```ts
 import { getModelConfig, mergeModelConfig } from "./modelResolver";
 import type { Model } from "../types";
 
 // 1) 获取默认模型配置（按能力）
 const m1 = getModelConfig("marketAnalyst");
 // m1.provider === "openrouter"
 // m1.model_name === "z-ai/glm-4.5-air:free"
 // 若 PROVIDER_API_KEYS 中配置了 openrouter 的 key，则 m1.api_key 已被自动注入
 
 // 2) 合并覆盖（例如局部调整模型）
 const base: Model = getModelConfig("researchManager");
 const m2 = mergeModelConfig(base, { model_name: "anthropic/claude-3-haiku" });
 // m2 继承 base.provider，并覆盖 model_name；api_key 同样自动补全
 ```
 
  ## 变更记录
 
 - 生成时间：2025-08-16T09:43:34.517Z
 - 人工更新：2025-08-17T00:46:18+08:00
