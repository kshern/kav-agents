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
