/**
 * 分析流水线共享类型
 * 供 core 与 web 端通过 type-only 方式共享，避免重复定义
 */

export interface AnalysisStepConfig {
  id: string;
  text: string;
  analyst: string;
  /**
   * 可选：步骤所需的上游状态字段列表（仅作元数据标注，运行时由编排器读取状态并选择性传递）
   */
  inputs?: string[];
  /**
   * 可选：步骤产出的状态字段列表（仅作元数据标注，便于 UI/日志展示与维护）
   */
  outputs?: string[];
  /**
   * 可选：步骤属于哪个辩论分组（同一分组会在执行时按轮次交替展开）
   * 例如：bull/bear 同时标注为 "main_debate"
   */
  debate_group?: string;
  /**
   * 可选：在同一辩论分组内的发言顺序（从 1 开始）。
   * 例如：1 表示先手（通常牛方），2 表示后手（通常熊方）。
   */
  debate_order?: number;
}

export type StepStatus = "started" | "completed" | "error";

export interface ProgressEvent {
  stepId: string;
  stepText: string;
  status: StepStatus;
  progress: number; // 0-100
  result?: unknown;
  error?: string;
}

export interface AnalysisResult {
  id: string; // 步骤ID
  text: string; // 步骤描述
  result: unknown; // 分析结果
}

export type TradeAgentOutput = AnalysisResult[];
