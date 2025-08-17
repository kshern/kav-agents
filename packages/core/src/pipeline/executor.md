# packages/core/src/pipeline/executor.ts
 
## 概述
 
- 文件职责：通用步骤执行器，提供无状态与有状态两种顺序执行方式，统一进度回调与中断处理。
- 上下文/模块：隶属 `pipeline/` 子系统，被编排层与能力层复用。
 
## 位置与命名
 
- 相对路径：`packages/core/src/pipeline/executor.ts`
- 同名文档：同目录下同名 .md
 
## 导出清单
 
### interface Step<TInput, TOutput>
 
- 形态: interface
- 字段:
  - `id: string`
  - `text: string`
  - `run: (input: TInput) => Promise<TOutput>`
 
### interface StepResult<T = unknown>
 
- 形态: interface
- 字段:
  - `id: string`
  - `text: string`
  - `result: T`
 
### interface RunStepsOptions
 
- 形态: interface
- 字段:
  - `onProgress?: (event: ProgressEvent) => void`
  - `abortSignal?: AbortSignal`
 
### interface StatefulStep<TState>
 
- 形态: interface
- 字段:
  - `id: string`
  - `text: string`
  - `run: (state: TState) => Promise<Partial<TState> | void>`
 
### function runSteps
 
- 形态: function (async)
- 签名: `<TInput>(steps: Array<Step<TInput, unknown>>, input: TInput, options?: RunStepsOptions) => Promise<Array<StepResult>>`
- 行为:
  - 按顺序执行 `steps`，每步前后通过 `onProgress` 发送 `started/completed` 事件，包含进度百分比与结果。
  - 捕获异常并发送 `error` 事件后抛出，由上层统一处理。
  - 若 `abortSignal.aborted`，抛出 `Error("Aborted")`。
 
### function runStepsStateful
 
- 形态: function (async)
- 签名: `<TState>(steps: Array<StatefulStep<TState>>, initialState: TState, options?: RunStepsOptions) => Promise<Array<StepResult<Partial<TState>>>>`
- 行为:
  - 在步骤间传递并合并状态：`state = { ...state, ...patch }`，`patch` 可能为空对象。
  - 进度事件格式与 `runSteps` 一致；异常与中断处理相同。
 
## 主要依赖
 
- 外部依赖(0)：无
- 本地依赖(1)：`../types/trade`（`ProgressEvent`、相关类型）
 
## 输入 / 输出
 
- 输入
  - `runSteps`
    - `steps: Array<Step<TInput, unknown>>`
    - `input: TInput`
    - `options?: RunStepsOptions`
  - `runStepsStateful`
    - `steps: Array<StatefulStep<TState>>`
    - `initialState: TState`
    - `options?: RunStepsOptions`
- 输出
  - `runSteps`: `Promise<Array<StepResult>>`
  - `runStepsStateful`: `Promise<Array<StepResult<Partial<TState>>>>`
- 侧效应
  - 通过 `onProgress` 发出进度事件：
    - `status: "started" | "completed" | "error"`
    - `progress: number (0-100)`
    - `result?: unknown`, `error?: string`
  - 出错或中断会抛出异常。
 
## 使用示例
 
```ts
import { runSteps, runStepsStateful, type Step, type StatefulStep } from "./executor";
 
// 无状态执行
const steps: Array<Step<number, number>> = [
  { id: "s1", text: "平方", run: async (x) => x * x },
  { id: "s2", text: "加一", run: async (x) => x + 1 },
];
const results1 = await runSteps(steps, 3, {
  onProgress: (e) => console.log(e.status, e.stepId, e.progress),
});
 
// 有状态执行
type State = { a?: number; b?: number };
const ssteps: Array<StatefulStep<State>> = [
  { id: "a", text: "计算 a", run: async () => ({ a: 42 }) },
  { id: "b", text: "计算 b", run: async (s) => ({ b: (s.a ?? 0) + 1 }) },
];
const results2 = await runStepsStateful(ssteps, {}, {
  onProgress: (e) => console.log(e.status, e.stepId, e.result),
});
```
 
## 变更记录
 
- 生成时间：2025-08-16T09:43:34.516Z
- 人工更新：2025-08-17T00:46:18+08:00
