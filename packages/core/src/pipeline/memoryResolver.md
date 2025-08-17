# packages/core/src/pipeline/memoryResolver.ts
 
 
 ## 概述
 
 - 文件职责：提供记忆策略的合并与解析，统一输出 `MemoryConfig`，并给出默认策略 `DEFAULT_MEMORY`。
 - 上下文/模块：位于 `packages/core/src/pipeline/`，服务于流水线/编排层在运行时确定实际使用的记忆策略。
 
 ## 位置与命名
 
 - 相对路径：`packages/core/src/pipeline/memoryResolver.ts`
 - 同名文档：同目录下同名 .md
 
 ## 导出清单
 
 ### const DEFAULT_MEMORY
 
 - 形态: constant
 - 名称: DEFAULT_MEMORY
 - 类型: `MemoryConfig`
 - 默认值: `{ strategy: "situation", topK: 2 }`
 - 说明: 与 `TradeAgent` 内部默认保持一致，用作全局兜底。
 
 ### function resolveStepMemory
 
 - 形态: function
 - 名称: resolveStepMemory
 - 签名: `(runtimeOverride: MemoryConfig | undefined, stepMemory: MemoryConfig | undefined, globalDefault: MemoryConfig = DEFAULT_MEMORY) => MemoryConfig`
 - 合并优先级: `runtimeOverride` > `stepMemory` > `globalDefault`
 - 返回: `MemoryConfig`
 
 ### function resolveDebateMemory
 
 - 形态: function
 - 名称: resolveDebateMemory
 - 签名: `(runtimeOverride: MemoryConfig | undefined, memberMemory: MemoryConfig | undefined, groupMemory: MemoryConfig | undefined, globalDefault: MemoryConfig = DEFAULT_MEMORY) => MemoryConfig`
 - 合并优先级: `runtimeOverride` > `memberMemory` > `groupMemory` > `globalDefault`
 - 返回: `MemoryConfig`
 
 ## 主要依赖
 
 - 外部依赖(0)：无
 - 本地依赖(1)：`../types`
 
 ## 输入 / 输出
 
 - 输入：`MemoryConfig | undefined`（见各函数参数说明）
 - 输出：`MemoryConfig`（纯函数返回，无副作用）
 
 ## 使用示例
 
 ```ts
 import { resolveStepMemory, resolveDebateMemory, DEFAULT_MEMORY } from "../pipeline/memoryResolver";
 import type { MemoryConfig } from "../types";
 
 // 步骤级记忆解析：运行时覆盖 > 步骤级 > 全局默认
 const runtimeOverride: MemoryConfig | undefined = { strategy: "history", topK: 3 };
 const stepMemory: MemoryConfig | undefined = { strategy: "situation", topK: 1 };
 const effectiveStepMemory = resolveStepMemory(runtimeOverride, stepMemory, DEFAULT_MEMORY);
 // 结果：{ strategy: "history", topK: 3 }
 
 // 辩论成员记忆解析：运行时覆盖 > 成员级 > 分组级 > 全局默认
 const memberMemory: MemoryConfig | undefined = undefined;
 const groupMemory: MemoryConfig | undefined = { strategy: "situation", topK: 2 };
 const effectiveDebateMemory = resolveDebateMemory(undefined, memberMemory, groupMemory, DEFAULT_MEMORY);
 // 结果：{ strategy: "situation", topK: 2 }
 ```
 
 ## 变更记录
 
 - 生成时间：2025-08-16T09:43:34.516Z
 - 人工更新：2025-08-17T00:46:18+08:00
