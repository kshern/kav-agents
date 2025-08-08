import { EventEmitter } from "events";
import { analyzeFundamentals } from "../abilities/analysts/FundamentalsAnalyst";
import { analyzeMarket } from "../abilities/analysts/MarketAnalyst";
import { BaseAgent } from "./BaseAgent";
import type { AnalystAbility } from "../types";
import { runStepsStateful, StatefulStep } from "../pipeline/executor";
import type {
  TradeAgentOutput,
  AnalysisStepConfig,
  ProgressEvent,
} from "../types";
import { analyzeNews } from "../abilities";
import { researchBull } from "../abilities/researchers/BullResearcher";
import { researchBear } from "../abilities/researchers/BearResearcher";
// import { manageResearch } from "../abilities/managers/ResearchManager";
import type { AgentState, Model } from "../types";

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
      inputs: ["company_of_interest", "trade_date"],
      outputs: ["fundamentals_report"],
    },
    {
      id: "analyze_market",
      text: "分析市场环境",
      analyst: "marketAnalyst",
      inputs: ["company_of_interest", "trade_date"],
      outputs: ["market_report"],
    },
    {
      id: "analyze_news",
      text: "分析新闻",
      analyst: "newsAnalyst",
      inputs: ["company_of_interest", "trade_date"],
      outputs: ["news_report"],
    },
    {
      id: "bull_researcher",
      text: "牛方研究员辩论",
      analyst: "bullResearcher",
      inputs: [
        "market_report",
        "sentiment_report",
        "news_report",
        "fundamentals_report",
        "investment_debate_state",
      ],
      outputs: ["investment_debate_state"],
    },
    {
      id: "bear_researcher",
      text: "熊方研究员辩论",
      analyst: "bearResearcher",
      inputs: [
        "market_report",
        "sentiment_report",
        "news_report",
        "fundamentals_report",
        "investment_debate_state",
      ],
      outputs: ["investment_debate_state"],
    },
    // {
    //   id: "manage_research",
    //   text: "研究经理裁决与投资计划",
    //   analyst: "researchManager",
    //   inputs: ["investment_debate_state"],
    //   outputs: ["investment_plan", "investment_debate_state"],
    // },
    
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
    this.registerAbility("newsAnalyst", analyzeNews);
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

    // 统一模型配置（供研究员与经理使用）
    const modelConfig: Model = {
      provider: "openrouter",
      model_name: "z-ai/glm-4.5-air:free",
      api_key: process.env.OPENROUTER_API_KEY,
    };

    // 初始化聚合状态（满足 AgentState 结构）
    const today = new Date().toISOString().split("T")[0];
    const initialState: AgentState = {
      company_of_interest: input.symbol,
      trade_date: today,
      sender: "TradeAgent",
      market_report: "",
      sentiment_report: "", // 目前无情绪分析步骤，先占位
      news_report: "",
      fundamentals_report: "",
      investment_debate_state: {
        history: [],
        count: 0,
      },
      investment_plan: "",
      trader_investment_plan: "",
      risk_debate_state: {
        risky_history: "",
        safe_history: "",
        neutral_history: "",
        history: "",
        latest_speaker: "",
        current_risky_response: "",
        current_safe_response: "",
        current_neutral_response: "",
        judge_decision: "",
        count: 0,
      },
      final_trade_decision: "",
      messages: [],
    };

    // 构建“有状态”的执行步骤
    const steps: Array<StatefulStep<AgentState>> = [
      {
        id: "analyze_fundamentals",
        text: "分析公司基本面",
        run: async (state) => {
          const analyst = this.getAbility<AnalystAbility>("fundamentalsAnalyst");
          if (!analyst) throw new Error("能力 'fundamentalsAnalyst' 未注册.");
          const res = await analyst({
            company_of_interest: state.company_of_interest,
            trade_date: state.trade_date,
          });
          // res: { fundamentals_report: string }
          return res as Partial<AgentState>;
        },
      },
      {
        id: "analyze_market",
        text: "分析市场环境",
        run: async (state) => {
          const analyst = this.getAbility<AnalystAbility>("marketAnalyst");
          if (!analyst) throw new Error("能力 'marketAnalyst' 未注册.");
          const res = await analyst({
            company_of_interest: state.company_of_interest,
            trade_date: state.trade_date,
          });
          // res: { market_report: string }
          return res as Partial<AgentState>;
        },
      },
      {
        id: "analyze_news",
        text: "分析新闻",
        run: async (state) => {
          const analyst = this.getAbility<AnalystAbility>("newsAnalyst");
          if (!analyst) throw new Error("能力 'newsAnalyst' 未注册.");
          const res = await analyst({
            company_of_interest: state.company_of_interest,
            trade_date: state.trade_date,
          });
          // res: { news_report: string }
          return res as Partial<AgentState>;
        },
      },
      {
        id: "bull_researcher",
        text: "牛方研究员辩论",
        run: async (state) => {
          const { investment_debate_state, market_report, sentiment_report, news_report, fundamentals_report } = state;
          const { investment_debate_state: updated } = await researchBull({
            state: {
              market_report: market_report || "",
              sentiment_report: sentiment_report || "",
              news_report: news_report || "",
              fundamentals_report: fundamentals_report || "",
              investment_debate_state: investment_debate_state || { history: [], count: 0 },
            },
            modelConfig,
          });
          return { investment_debate_state: updated } as Partial<AgentState>;
        },
      },
      {
        id: "bear_researcher",
        text: "熊方研究员辩论",
        run: async (state) => {
          const { investment_debate_state, market_report, sentiment_report, news_report, fundamentals_report } = state;
          const { investment_debate_state: updated } = await researchBear({
            state: {
              market_report: market_report || "",
              sentiment_report: sentiment_report || "",
              news_report: news_report || "",
              fundamentals_report: fundamentals_report || "",
              investment_debate_state: investment_debate_state || { history: [], count: 0 },
            },
            modelConfig,
          });
          return { investment_debate_state: updated } as Partial<AgentState>;
        },
      },
      // {
      //   id: "manage_research",
      //   text: "研究经理裁决与投资计划",
      //   run: async (state) => {
      //     const { investment_debate_state } = state;
      //     const { investment_debate_state: updated, investment_plan } = await manageResearch({
      //       investment_debate_state: investment_debate_state || { history: [], count: 0 },
      //       modelConfig,
      //     });
      //     return { investment_debate_state: updated, investment_plan } as Partial<AgentState>;
      //   },
      // },
    ];

    try {
      const results = await runStepsStateful<AgentState>(steps, initialState, {
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
