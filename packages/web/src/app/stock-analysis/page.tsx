import React from "react";
import StartAnalysis from "@/features/stock-analysis/StartAnalysis";

/**
 * 股票分析页面
 * 仅负责渲染主组件，所有业务逻辑已封装在features目录
 */
export default function StockAnalysisPage() {
  return <StartAnalysis />;
}
