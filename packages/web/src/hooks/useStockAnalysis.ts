import { useState, useRef, useEffect } from "react";
import {
  Database,
  LineChart,
  Newspaper,
  ClipboardList,
  Users,
  BarChart3,
  Brain,
  Shield,
  Megaphone,
} from "lucide-react";
import {
  AnalysisStatus,
  AnalysisStep,
  StepStatus,
  StockAnalysisHook,
} from "../types";
import type { ProgressEvent, AnalysisStepConfig } from "@core";

// 步骤图标映射
const STEP_ICONS: Record<string, React.ComponentType> = {
  // 基础
  analyze_fundamentals: Database,
  analyzeFundamentals: Database,
  analyze_market: LineChart,
  analyzeMarket: LineChart,

  // 扩展步骤（兜底到默认图标，保证向后兼容）
  analyze_news: Newspaper,
  analyzeNews: Newspaper,
  manage_research: ClipboardList,
  manageResearch: ClipboardList,
  analyze_social_media: Megaphone,
  analyzeSocialMedia: Megaphone,
  manage_risk: Shield,
  manageRisk: Shield,
  research_bull: Brain,
  researchBull: Brain,
  research_bear: Brain,
  researchBear: Brain,
  // 新增：与后端 TradeAgent 配置对齐
  bull_researcher: Brain,
  bear_researcher: Brain,
  debate_aggressive: Users,
  debateAggressive: Users,
  debate_conservative: Users,
  debateConservative: Users,
  debate_neutral: Users,
  debateNeutral: Users,
  create_trade_plan: BarChart3,
  createTradePlan: BarChart3,
};

/**
 * 股票分析Hook
 * 管理分析状态、进度和步骤，通过 TradeAgent 驱动分析流程
 */
export function useStockAnalysis(): StockAnalysisHook {
  // 状态管理
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [stockCode, setStockCode] = useState("");
  const [steps, setSteps] = useState<AnalysisStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [isStepsLoaded, setIsStepsLoaded] = useState(false);

  // 使用 useRef 保存 EventSource 实例
  const eventSourceRef = useRef<EventSource | null>(null);
  // 追踪页面卸载/隐藏，用于在用户离开页面时避免误报错误
  const unloadingRef = useRef(false);

  useEffect(() => {
    const onPageHide = () => {
      unloadingRef.current = true;
    };
    const onBeforeUnload = () => {
      unloadingRef.current = true;
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  /**
   * 从后端获取分析步骤配置
   */
  const loadAnalysisSteps = async () => {
    try {
      const response = await fetch("/api/analysis/steps");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { success, data } = await response.json();
      if (success && data) {
        // 将后端配置展开为包含多轮辩论的前端步骤，默认3轮
        const DEFAULT_ROUNDS = 3;
        const configs: AnalysisStepConfig[] = data;

        const expanded: AnalysisStep[] = [];
        const processedGroups = new Set<string>();
        for (const cfg of configs) {
          if (cfg.debate_group) {
            if (processedGroups.has(cfg.debate_group)) continue;
            processedGroups.add(cfg.debate_group);

            const groupMembers = configs
              .filter((c) => c.debate_group === cfg.debate_group)
              .slice()
              .sort((a, b) => (a.debate_order ?? 0) - (b.debate_order ?? 0));

            for (let i = 1; i <= DEFAULT_ROUNDS; i++) {
              for (const m of groupMembers) {
                expanded.push({
                  id: `${m.id}_r${i}`,
                  text: `${m.text}（第${i}轮）`,
                  icon: STEP_ICONS[m.id] || Database,
                  status: "pending",
                });
              }
            }
            continue;
          }

          // 非辩论分组按原样加入
          expanded.push({
            id: cfg.id,
            text: cfg.text,
            icon: STEP_ICONS[cfg.id] || Database,
            status: "pending",
          });
        }

        setSteps(expanded);
        setIsStepsLoaded(true);
      }
    } catch (error) {
      console.error("加载分析步骤配置失败:", error);
      // 使用默认配置作为降级方案
      setSteps([
        {
          id: "analyze_fundamentals",
          text: "分析公司基本面",
          icon: Database,
          status: "pending",
        },
        {
          id: "analyze_market",
          text: "分析市场环境",
          icon: LineChart,
          status: "pending",
        },
      ]);
      setIsStepsLoaded(true);
    }
  };

  // 组件初始化时加载步骤配置
  useEffect(() => {
    loadAnalysisSteps();
  }, []);

  // 组件卸载时清理 EventSource 连接，防止内存/连接泄漏
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  /**
   * 处理进度事件
   * @param event 进度事件数据
   */
  const handleProgressEvent = (event: ProgressEvent) => {
    console.log("收到进度事件:", event);

    // 更新进度
    setProgress(event.progress);

    // 根据事件类型更新步骤状态
    if (event.stepId === "final") {
      // 最终完成事件
      setStatus("complete");
    } else if (event.stepId === "error") {
      // 全局错误事件
      setStatus("error");
      console.error("分析失败:", event.error);
    } else {
      // 单个步骤事件
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === event.stepId) {
            let newStatus: StepStatus;
            switch (event.status) {
              case "started":
                newStatus = "in-progress";
                break;
              case "completed":
                newStatus = "completed";
                break;
              case "error":
                newStatus = "error";
                break;
              default:
                newStatus = step.status;
            }
            return { ...step, status: newStatus };
          }
          return step;
        }),
      );
    }
  };

  /**
   * 开始分析
   * @param code 股票代码
   */
  const handleStartAnalysis = async (code: string) => {
    // 确保步骤配置已加载
    if (!isStepsLoaded) {
      console.warn("分析步骤配置尚未加载完成");
      return;
    }

    // 如果已有连接，先关闭
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStockCode(code);
    setStatus("processing");
    setProgress(0);
    // 重置所有步骤状态为 pending
    setSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" as StepStatus })),
    );

    try {
      // 直接创建 EventSource 连接，使用 GET 方式传递股票代码
      const eventSource = new EventSource(
        `/api/analysis/stream?symbol=${encodeURIComponent(code)}`,
      );
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const progressEvent: ProgressEvent = JSON.parse(event.data);
          handleProgressEvent(progressEvent);
        } catch (error) {
          console.error("解析进度事件失败:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.warn("EventSource 连接状态变更:", error);
        // 用户正在离开页面/关闭标签，视为正常中断，不标记为错误
        if (unloadingRef.current) {
          try {
            eventSource.close();
          } catch {}
          return;
        }
        // 若仍处于 processing 且尚未收到 final/error 事件，则认定为错误
        setStatus((prev) => (prev === "processing" ? "error" : prev));
        try {
          eventSource.close();
        } catch {}
      };

      eventSource.onopen = () => {
        console.log("EventSource 连接已建立");
      };
    } catch (error) {
      console.error("启动分析失败:", error);
      setStatus("error");
    }
  };

  /**
   * 重置分析
   */
  const handleReset = () => {
    // 关闭 EventSource 连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setStatus("idle");
    setStockCode("");
    setProgress(0);
    // 重置所有步骤状态为 pending
    setSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending" as StepStatus })),
    );
  };

  return {
    status,
    stockCode,
    steps,
    progress,
    isStepsLoaded, // 新增：步骤加载状态
    handleStartAnalysis,
    handleReset,
  };
}
