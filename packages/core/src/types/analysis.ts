/**
 * 分析流水线共享类型
 * 供 core 与 web 端通过 type-only 方式共享，避免重复定义
 */

export interface AnalysisStepConfig {
  id: string;
  text: string;
  analyst: string;
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
