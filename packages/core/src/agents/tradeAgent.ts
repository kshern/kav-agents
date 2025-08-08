import { EventEmitter } from "events";
import { analyzeFundamentals } from "../abilities/analysts/FundamentalsAnalyst";
import { analyzeMarket } from "../abilities/analysts/MarketAnalyst";
import { BaseAgent } from "./BaseAgent";
import { FundamentalsAnalystProps, MarketAnalystProps } from "../types";

/**
 * 定义 TradeAgent 的输入类型
 */
export interface TradeAgentInput {
  symbol: string; // 股票代码
}

/**
 * 定义单个分析步骤的输出结果
 */
export interface AnalysisResult {
  id: string; // 步骤ID
  text: string; // 步骤描述
  result: unknown; // 分析结果
}

/**
 * 定义 TradeAgent 的输出类型
 */
export type TradeAgentOutput = AnalysisResult[];

/**
 * 定义分析步骤的配置结构
 */
export interface AnalysisStepConfig {
  id: string;
  text: string;
  analyst: string;
}

/**
 * 定义进度事件的数据结构
 */
export interface ProgressEvent {
  stepId: string;
  stepText: string;
  status: "started" | "completed" | "error";
  progress: number; // 0-100
  result?: unknown;
  error?: string;
}

/**
 * 交易 Agent，负责编排不同的分析师能力，完成对指定股票的综合分析
 */
export class TradeAgent extends BaseAgent<TradeAgentInput, TradeAgentOutput> {
  protected readonly name = "TradeAgent";
  private eventEmitter = new EventEmitter();

  // 定义分析步骤（静态配置，作为唯一数据源）
  public static readonly ANALYSIS_STEPS: AnalysisStepConfig[] = [
    {
      id: "analyze_fundamentals",
      text: "分析公司基本面",
      analyst: "fundamentalsAnalyst",
    },
    { id: "analyze_market", text: "分析市场环境", analyst: "marketAnalyst" },
  ];

  // 实例使用静态配置
  private readonly analysisSteps = TradeAgent.ANALYSIS_STEPS;

  /**
   * 获取分析步骤配置（静态方法）
   * @returns 分析步骤配置数组
   */
  public static getAnalysisSteps(): AnalysisStepConfig[] {
    return TradeAgent.ANALYSIS_STEPS;
  }

  /**
   * 构造函数，在实例化时注册所需的能力
   */
  constructor() {
    super();
    this.registerAbility("fundamentalsAnalyst", analyzeFundamentals);
    this.registerAbility("marketAnalyst", analyzeMarket);
  }

  /**
   * 订阅进度事件
   * @param listener 事件监听器
   */
  public onProgress(listener: (event: ProgressEvent) => void): void {
    this.eventEmitter.on("progress", listener);
  }

  /**
   * 取消订阅进度事件
   * @param listener 事件监听器
   */
  public offProgress(listener: (event: ProgressEvent) => void): void {
    this.eventEmitter.off("progress", listener);
  }

  /**
   * 发送进度事件
   * @param event 进度事件数据
   */
  private emitProgress(event: ProgressEvent): void {
    this.eventEmitter.emit("progress", event);
  }

  /**
   * 执行分析流程
   * @param input 包含股票代码的输入对象
   * @returns 返回一个包含所有分析步骤结果的数组
   */
  public async run(input: TradeAgentInput): Promise<TradeAgentOutput> {
    this.log(`开始为股票 ${input.symbol} 进行分析...`);
    const output: TradeAgentOutput = [];
    const totalSteps = this.analysisSteps.length;

    for (let i = 0; i < this.analysisSteps.length; i++) {
      const step = this.analysisSteps[i];
      const progress = Math.round((i / totalSteps) * 100);

      try {
        // 发送步骤开始事件
        this.emitProgress({
          stepId: step.id,
          stepText: step.text,
          status: "started",
          progress,
        });

        this.log(`执行步骤: ${step.text}`);
        const analyst = this.getAbility<
          | ((
              props: FundamentalsAnalystProps
            ) => Promise<{ fundamentals_report: string }>)
          | ((props: MarketAnalystProps) => Promise<{ market_report: string }>)
        >(step.analyst);

        if (!analyst) {
          throw new Error(`能力 '${step.analyst}' 未注册.`);
        }

        // 准备分析师所需的参数
        const analystInput = {
          company_of_interest: input.symbol,
          trade_date: new Date().toISOString().split("T")[0], // 使用当前日期
        };

        // 调用分析师的 run 方法，并传递转换后的输入
        const result = await analyst(analystInput);

        // 将结果存入输出数组
        const analysisResult = {
          id: step.id,
          text: step.text,
          result,
        };
        output.push(analysisResult);

        // 发送步骤完成事件
        const completedProgress = Math.round(((i + 1) / totalSteps) * 100);
        this.emitProgress({
          stepId: step.id,
          stepText: step.text,
          status: "completed",
          progress: completedProgress,
          result,
        });
      } catch (err) {
        // 发送步骤错误事件
        this.emitProgress({
          stepId: step.id,
          stepText: step.text,
          status: "error",
          progress,
          error: err instanceof Error ? err.message : String(err),
        });
        this.handleError(err); // 错误处理并抛出异常
      }
    }

    this.log(`股票 ${input.symbol} 的分析完成.`);
    return output;
  }
}
