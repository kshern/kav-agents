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
  /**
   * 可选：为该辩论分组声明默认轮次。
   * 说明：由于分组级元数据目前附着在步骤上，任意属于同一分组的步骤都可以标注该字段；
   * 编排器会在首次展开该分组时读取到的第一个值作为该分组的默认轮次。
   */
  debate_rounds?: number;
}

/**
 * 新的数据结构：辩论成员配置（用于分组内）
 */
export interface DebateMemberConfig {
  id: string; // 成员步骤ID
  text: string; // 成员显示文案
  analyst: string; // 成员能力键
  inputs?: string[]; // 输入状态键
  outputs?: string[]; // 输出状态键
  order?: number; // 组内顺序，1 开始（省略则默认按出现顺序）
}

/**
 * 新的数据结构：辩论分组配置
 * 使用 discriminated union 的方式，通过 type: 'debate' 来识别
 */
export interface DebateGroupConfig {
  type: "debate"; // 标识为辩论分组
  group: string; // 分组键，如 "main_debate"
  rounds?: number; // 该分组的默认轮次（可选）
  members: DebateMemberConfig[]; // 分组成员
}

/**
 * 流水线条目联合类型：要么是普通步骤（AnalysisStepConfig），要么是辩论分组（DebateGroupConfig）
 */
export type PipelineItemConfig = AnalysisStepConfig | DebateGroupConfig;

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
