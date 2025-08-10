import { ComponentType } from "react";

/**
 * 分析状态类型
 */
export type AnalysisStatus = "idle" | "processing" | "complete" | "error";

/**
 * 步骤状态类型
 */
export type StepStatus = "pending" | "in-progress" | "completed" | "error";

/**
 * 分析步骤类型
 */
export interface AnalysisStep {
  id: string;
  text: string;
  icon: ComponentType<{ className?: string }>;
  status: StepStatus;
}

/**
 * 股票输入表单属性
 */
export interface StockInputFormProps {
  onSubmit: (stockCode: string) => void;
  isLoading: boolean;
}

/**
 * 步骤项属性
 */
export interface StepItemProps {
  step: {
    id: string;
    text: string;
    icon: ComponentType<{ className?: string }>;
  };
  status: StepStatus;
  isLast: boolean;
}

/**
 * 进度跟踪器属性
 */
export interface ProgressTrackerProps {
  steps: AnalysisStep[];
  overallProgress: number;
}

/**
 * 分析报告属性
 */
export interface AnalysisReportProps {
  stockCode: string;
  onReset: () => void;
}

/**
 * 股票分析Hook返回类型
 */
export interface StockAnalysisHook {
  status: AnalysisStatus;
  stockCode: string;
  steps: AnalysisStep[];
  progress: number;
  isStepsLoaded: boolean; // 新增：步骤配置加载状态
  handleStartAnalysis: (code: string, analysisId?: string) => void;
  handleReset: () => void;
}
