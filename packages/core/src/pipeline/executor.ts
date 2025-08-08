/**
 * 通用分析步骤执行器（最小实现）
 * - 统一顺序执行、进度回调
 * - 后续可扩展：缓存、并行、超时/重试、DAG 依赖
 */
import type { ProgressEvent } from "../types/analysis";

export interface Step<TInput, TOutput> {
  id: string;
  text: string;
  // 运行步骤：可在闭包中使用外部注入的能力/依赖
  run: (input: TInput) => Promise<TOutput>;
}

export interface StepResult<T = unknown> {
  id: string;
  text: string;
  result: T;
}

export interface RunStepsOptions {
  onProgress?: (event: ProgressEvent) => void;
}

/**
 * 顺序执行步骤的最小实现
 */
export async function runSteps<TInput>(
  steps: Array<Step<TInput, unknown>>,
  input: TInput,
  options: RunStepsOptions = {},
): Promise<Array<StepResult>> {
  const results: Array<StepResult> = [];
  const totalSteps = steps.length || 1;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const progress = Math.round((i / totalSteps) * 100);

    try {
      options.onProgress?.({
        stepId: step.id,
        stepText: step.text,
        status: "started",
        progress,
      });

      const res = await step.run(input);

      results.push({ id: step.id, text: step.text, result: res });

      const completedProgress = Math.round(((i + 1) / totalSteps) * 100);
      options.onProgress?.({
        stepId: step.id,
        stepText: step.text,
        status: "completed",
        progress: completedProgress,
        result: res,
      });
    } catch (err) {
      options.onProgress?.({
        stepId: step.id,
        stepText: step.text,
        status: "error",
        progress,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err; // 交由上层统一处理
    }
  }

  return results;
}

/**
 * 带状态的步骤定义：每一步接收当前聚合状态，返回对状态的增量补丁
 */
export interface StatefulStep<TState> {
  id: string;
  text: string;
  // 返回 Partial<TState> 作为补丁；允许返回 void 表示不变更
  run: (state: TState) => Promise<Partial<TState> | void>;
}

/**
 * 有状态的顺序执行器
 * - 在步骤间传递并合并状态，满足下游依赖上游产出的场景
 * - 进度事件与无状态版本保持一致
 */
export async function runStepsStateful<TState>(
  steps: Array<StatefulStep<TState>>,
  initialState: TState,
  options: RunStepsOptions = {},
): Promise<Array<StepResult<Partial<TState>>>> {
  const results: Array<StepResult<Partial<TState>>> = [];
  const totalSteps = steps.length || 1;
  let state = initialState;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const progress = Math.round((i / totalSteps) * 100);

    try {
      options.onProgress?.({
        stepId: step.id,
        stepText: step.text,
        status: "started",
        progress,
      });

      const patch = (await step.run(state)) || {};
      // 合并状态
      state = { ...state, ...patch } as TState;

      const completedProgress = Math.round(((i + 1) / totalSteps) * 100);
      results.push({ id: step.id, text: step.text, result: patch });
      options.onProgress?.({
        stepId: step.id,
        stepText: step.text,
        status: "completed",
        progress: completedProgress,
        result: patch,
      });
    } catch (err) {
      options.onProgress?.({
        stepId: step.id,
        stepText: step.text,
        status: "error",
        progress,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  return results;
}
