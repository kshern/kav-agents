# packages/core/src/agents/BaseAgent.ts

## 概述

- 文件职责：定义所有具体 Agent 的抽象基类，提供能力注册/获取、进度事件（基于 `EventEmitter`）、统一步骤执行封装、日志与错误处理等通用能力。
- 上下文/模块：`agents` 核心执行框架；被 `TradeAgent` 等具体智能体继承复用。

## 位置与命名

- 相对路径：`packages/core/src/agents/BaseAgent.ts`
- 同名文档：同目录下同名 .md

## 导出清单

- class `BaseAgent<TInput = unknown, TOutput = unknown>`
  - 抽象属性：`protected abstract readonly name: string`
  - 公共方法：
    - `init(): Promise<void>` 初始化钩子（可覆盖）
    - `run(input: TInput, options?: { signal?: AbortSignal }): Promise<TOutput>` 抽象主入口（子类实现）
    - `setLogger(logger: { info(...); error(...); debug(...); }): void`
    - `onProgress(listener: (event: ProgressEvent) => void): void`
    - `offProgress(listener: (event: ProgressEvent) => void): void`
  - 受保护方法：
    - `registerAbility(key: string, ability: unknown): void`
    - `getAbility<U>(key: string): U | undefined`
    - `emitProgress(event: ProgressEvent): void`
    - `setStepMeta(stepId: string, meta: { itemType: "step" | "debate"; debateGroup?: string; debateRound?: number; debateMemberId?: string; debateMemberText?: string; }): void`
    - `getStepMeta(stepId: string): { ... } | undefined`
    - `buildDynamicState(inputKeys: string[], state: unknown): Record<string, unknown>`
    - `extractOutputs(outputKeys: string[], rawResult: Record<string, unknown>, state: unknown): Record<string, unknown>`
    - `executeSteps<TState>(steps: Array<StatefulStep<TState>>, initialState: TState, options?: { signal?: AbortSignal }): Promise<Array<StepResult<Partial<TState>>>>`
    - `log(message: string): void`
    - `handleError(err: unknown): never`

## 主要依赖

- 外部依赖：`events`
- 本地依赖：`../types/trade`（`ProgressEvent`）、`../pipeline/executor`（`runStepsStateful`/`StatefulStep`/`StepResult`/`RunStepsOptions`）

## 输入 / 输出

- 输入：
  - `run(input: TInput, options?)` 由子类定义具体输入结构
  - `onProgress(listener)` 订阅进度事件；事件负载为 `ProgressEvent`
- 输出：
  - `run(...)` 返回 `Promise<TOutput>`
  - 事件：通过 `emitProgress` 向外抛出步骤进度与最终完成事件（`stepId = "final"`）

## 使用示例

```ts
import { BaseAgent } from "./BaseAgent";
import type { StatefulStep } from "../pipeline/executor";

type In = { text: string };
type Out = { length: number };

class DemoAgent extends BaseAgent<In, Out> {
  protected readonly name = "DemoAgent";

  public async run(input: In): Promise<Out> {
    const steps: Array<StatefulStep<{ text: string; length?: number }>> = [
      {
        id: "measure",
        text: "计算长度",
        run: async (state) => ({ length: state.text.length }),
      },
    ];
    const results = await this.executeSteps(steps, { text: input.text });
    const final = results[results.length - 1]?.result as { length: number };
    return { length: final.length };
  }
}

const agent = new DemoAgent();
agent.onProgress((e) => console.log("progress", e));
agent.run({ text: "hello" }).then(console.log);
```

## 变更记录

- 最后更新：2025-08-17
