import { EventEmitter } from "events";
import { analyzeFundamentals } from "../abilities/analysts/FundamentalsAnalyst";
import { analyzeMarket } from "../abilities/analysts/MarketAnalyst";
import { BaseAgent } from "./BaseAgent";
import { FundamentalsAnalystProps, MarketAnalystProps } from "../types";
import { runSteps, Step } from "../pipeline/executor";
import type {
  TradeAgentOutput,
  AnalysisStepConfig,
  ProgressEvent,
} from "../types";

/**
 * 定义 TradeAgent 的输入类型
 */
export interface TradeAgentInput {
  symbol: string; // 股票代码
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

    // 构建可执行步骤列表，复用已注册的能力
    const steps: Array<Step<TradeAgentInput, unknown>> = this.analysisSteps.map(
      (cfg) => ({
        id: cfg.id,
        text: cfg.text,
        run: async (inpt: TradeAgentInput) => {
          this.log(`执行步骤: ${cfg.text}`);

          const analyst = this.getAbility<
            | ((
                props: FundamentalsAnalystProps
              ) => Promise<{ fundamentals_report: string }>)
            | ((
                props: MarketAnalystProps
              ) => Promise<{ market_report: string }>)
          >(cfg.analyst);

          if (!analyst) {
            throw new Error(`能力 '${cfg.analyst}' 未注册.`);
          }

          const analystInput = {
            company_of_interest: inpt.symbol,
            trade_date: new Date().toISOString().split("T")[0],
          };

          return analyst(analystInput);
        },
      })
    );

    try {
      const results = await runSteps(steps, input, {
        onProgress: (e) =>
          this.emitProgress({
            stepId: e.stepId,
            stepText: e.stepText,
            status: e.status,
            progress: e.progress,
            result: e.result,
            error: e.error,
          }),
      });

      this.log(`股票 ${input.symbol} 的分析完成.`);
      return results as TradeAgentOutput;
    } catch (err) {
      this.handleError(err);
    }
  }
}
