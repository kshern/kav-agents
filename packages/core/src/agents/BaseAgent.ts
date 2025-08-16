import { EventEmitter } from "events";
import type { ProgressEvent } from "../types/trade";
import { runStepsStateful, type RunStepsOptions, type StatefulStep, type StepResult } from "../pipeline/executor";

/**
 * 抽象基础 Agent 类，所有具体 Agent 需继承本类
 * 使用范型保证输入输出类型安全，避免使用 any
 */
export abstract class BaseAgent<TInput = unknown, TOutput = unknown> {
  /** Agent 名称，用于日志与监控 */
  protected abstract readonly name: string;

  /** 运行时上下文，可用于缓存数据或共享依赖 */
  protected readonly context: Record<string, unknown> = {};

  /** 进度事件总线 */
  private readonly eventEmitter = new EventEmitter();

  /**
   * 可注入的轻量日志器接口（默认可为空，子类可设置为 FileLogger 等实现）
   */
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  protected logger?: {
    info(scope: string, message: string, data?: unknown): Promise<void>;
    error(scope: string, message: string, data?: unknown): Promise<void>;
    debug(scope: string, message: string, data?: unknown): Promise<void>;
  };

  /**
   * 允许外部注入/覆盖日志器（例如为每次会话写入单独的 JSONL 文件）
   */
  public setLogger(logger: {
    info(scope: string, message: string, data?: unknown): Promise<void>;
    error(scope: string, message: string, data?: unknown): Promise<void>;
    debug(scope: string, message: string, data?: unknown): Promise<void>;
  }): void {
    this.logger = logger;
  }

  /** 步骤元信息：用于前端分组渲染（如辩论分组/轮次/成员） */
  private readonly stepMeta: Record<string, {
    itemType: "step" | "debate";
    debateGroup?: string;
    debateRound?: number;
    debateMemberId?: string;
    debateMemberText?: string;
  }> = {};

  /** 初始化钩子：子类可重写，用于加载模型、配置、依赖等 */
  public async init(): Promise<void> {
    // 默认实现为空
  }

  /**
   * 主执行入口，子类必须实现
   * @param input 外部输入数据
   * @param options 运行选项（如取消信号）
   * @returns 输出结果
   */
  public abstract run(
    input: TInput,
    options?: { signal?: AbortSignal },
  ): Promise<TOutput>;

  /**
   * 向上下文注册依赖/能力
   * @param key 唯一键
   * @param ability 依赖实例
   */
  protected registerAbility(key: string, ability: unknown): void {
    this.context[key] = ability;
  }

  /**
   * 获取已注册的依赖/能力
   * @param key 唯一键
   * @returns 依赖实例或 undefined
   */
  protected getAbility<U>(key: string): U | undefined {
    return this.context[key] as U | undefined;
  }

  /**
   * 订阅进度事件
   */
  public onProgress(listener: (event: ProgressEvent) => void): void {
    this.eventEmitter.on("progress", listener);
  }

  /**
   * 取消订阅进度事件
   */
  public offProgress(listener: (event: ProgressEvent) => void): void {
    this.eventEmitter.off("progress", listener);
  }

  /**
   * 发送进度事件（子类可在必要时调用）
   */
  protected emitProgress(event: ProgressEvent): void {
    this.eventEmitter.emit("progress", event);
  }

  /**
   * 注册步骤元信息（在构建步骤时由子类调用）
   */
  protected setStepMeta(stepId: string, meta: {
    itemType: "step" | "debate";
    debateGroup?: string;
    debateRound?: number;
    debateMemberId?: string;
    debateMemberText?: string;
  }): void {
    this.stepMeta[stepId] = meta;
  }

  /**
   * 获取步骤元信息
   */
  protected getStepMeta(stepId: string): (typeof this.stepMeta)[string] | undefined {
    return this.stepMeta[stepId];
  }

  /**
   * 统一日志输出，后续可替换为更专业的日志库
   * @param message 日志内容
   */
  protected log(message: string): void {
    // eslint-disable-next-line no-console
    console.log(`[${this.name}] ${message}`);
  }

  /**
   * 统一错误处理，可在此处接入监控系统
   * @param err 捕获的异常
   */
  protected handleError(err: unknown): never {
    // eslint-disable-next-line no-console
    console.error(`[${this.name}]`, err);
    throw err;
  }

  /**
   * 根据配置 inputs 动态构造能力所需的 state 片段
   */
  protected buildDynamicState(
    inputKeys: string[],
    state: unknown,
  ): Record<string, unknown> {
    const dynamicState: Record<string, unknown> = {};
    const s = state as unknown as Record<string, unknown>;
    for (const key of inputKeys) {
      const val = s[key];
      if (val !== undefined) {
        dynamicState[key] = val;
      }
    }
    return dynamicState;
  }

  /**
   * 按 outputs 抽取结果片段，缺失则从旧 state 透传
   */
  protected extractOutputs(
    outputKeys: string[],
    rawResult: Record<string, unknown>,
    state: unknown,
  ): Record<string, unknown> {
    const s = state as unknown as Record<string, unknown>;
    return outputKeys.reduce<Record<string, unknown>>((acc, key) => {
      const v = rawResult[key];
      acc[key] = v !== undefined ? v : s[key];
      return acc;
    }, {});
  }

  /**
   * 统一封装有状态步骤执行：
   * - 转发进度事件并合并步骤元信息
   * - 支持外部取消信号
   * - 执行完成时发送 final 事件
   */
  protected async executeSteps<TState>(
    steps: Array<StatefulStep<TState>>, 
    initialState: TState, 
    options?: { signal?: AbortSignal },
  ): Promise<Array<StepResult<Partial<TState>>>> {
    const results = await runStepsStateful<TState>(steps, initialState, {
      onProgress: (e) => {
        const meta = this.getStepMeta(e.stepId);
        this.emitProgress({
          stepId: e.stepId,
          stepText: e.stepText,
          status: e.status,
          progress: e.progress,
          result: e.result,
          error: e.error,
          itemType: meta?.itemType ?? "step",
          debateGroup: meta?.debateGroup,
          debateRound: meta?.debateRound,
          debateMemberId: meta?.debateMemberId,
          debateMemberText: meta?.debateMemberText,
        });
      },
      abortSignal: options?.signal,
    } as RunStepsOptions);

    // 统一发送最终完成事件
    this.emitProgress({
      stepId: "final",
      stepText: "分析完成",
      status: "completed",
      progress: 100,
      result: results,
    });

    return results;
  }
}
