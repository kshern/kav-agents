import { EventEmitter } from "events";
import { BaseAgent } from "./BaseAgent";
import { analyzeFundamentals } from "../abilities/analysts/FundamentalsAnalyst";
import { analyzeMarket } from "../abilities/analysts/MarketAnalyst";
import { analyzeNews } from "../abilities";
import type {
  AnalystAbility,
  AnalystCommonProps,
  DebateResearcherAbility,
} from "../types";
import { runStepsStateful, StatefulStep } from "../pipeline/executor";
import type {
  TradeAgentOutput,
  AnalysisStepConfig,
  ProgressEvent,
} from "../types";
import { researchBull } from "../abilities/researchers/BullResearcher";
import { researchBear } from "../abilities/researchers/BearResearcher";
// import { manageResearch } from "../abilities/managers/ResearchManager";
import type { AgentState, Model } from "../types";

/**
 * 定义 TradeAgent 的输入类型
 */
export interface TradeAgentInput {
  symbol: string; // 股票代码
  debate_rounds?: number; // 辩论轮次（可选，默认3轮）
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
      debate_group: "main_debate",
      debate_order: 1,
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
      debate_group: "main_debate",
      debate_order: 2,
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
    // 注册辩论型研究员能力，使用键与配置中的 analyst 对齐，便于通用调用
    this.registerAbility("bullResearcher", researchBull);
    this.registerAbility("bearResearcher", researchBear);
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
   * 基于静态配置 ANALYSIS_STEPS 自动生成可执行步骤，支持多轮辩论
   * @param debateRounds 辩论轮次
   * @param modelConfig 模型配置
   */
  private buildStepsFromConfig(
    debateRounds: number,
    modelConfig: Model
  ): Array<StatefulStep<AgentState>> {
    const steps: Array<StatefulStep<AgentState>> = [];
    const processedGroups = new Set<string>();

    for (const cfg of this.analysisSteps) {
      // 若为辩论分组：只在第一次遇到该分组时展开所有轮次与成员
      if (cfg.debate_group) {
        if (processedGroups.has(cfg.debate_group)) continue;
        processedGroups.add(cfg.debate_group);

        const groupMembers = this.analysisSteps
          .filter((c) => c.debate_group === cfg.debate_group)
          .slice()
          .sort((a, b) => (a.debate_order ?? 0) - (b.debate_order ?? 0));

        for (let i = 1; i <= debateRounds; i++) {
          for (const m of groupMembers) {
            steps.push({
              id: `${m.id}_r${i}`,
              text: `${m.text}（第${i}轮）`,
              run: async (state) => {
                const ability = this.getAbility<DebateResearcherAbility>(
                  m.analyst
                );
                if (!ability) throw new Error(`能力 '${m.analyst}' 未注册.`);

                const {
                  investment_debate_state,
                  market_report,
                  sentiment_report,
                  news_report,
                  fundamentals_report,
                } = state;

                const { investment_debate_state: updated } = await ability({
                  state: {
                    market_report: market_report || "",
                    sentiment_report: sentiment_report || "",
                    news_report: news_report || "",
                    fundamentals_report: fundamentals_report || "",
                    investment_debate_state: investment_debate_state || {
                      history: [],
                      count: 0,
                    },
                  },
                  modelConfig,
                });
                return {
                  investment_debate_state: updated,
                } as Partial<AgentState>;
              },
            });
          }
        }

        continue;
      }

      // 非分组：按配置生成单步（通用 inputs -> state 参数映射）
      steps.push({
        id: cfg.id,
        text: cfg.text,
        run: async (state) => {
          const analyst = this.getAbility<AnalystAbility>(cfg.analyst);
          if (!analyst) throw new Error(`能力 '${cfg.analyst}' 未注册.`);
          // 统一向通用分析师传递最小必要参数，满足 AnalystAbility 的入参类型
          const payload: AnalystCommonProps = {
            company_of_interest: state.company_of_interest,
            trade_date: state.trade_date,
          };
          const res = await analyst(payload);
          return res as Partial<AgentState>;
        },
      });
    }

    return steps;
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

    // 根据输入参数控制辩论轮次（默认3轮），并由配置自动生成步骤
    const debateRounds = Number.isInteger(input.debate_rounds)
      ? Math.max(1, input.debate_rounds as number)
      : 3;
    const steps = this.buildStepsFromConfig(debateRounds, modelConfig);

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
