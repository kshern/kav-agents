import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { AnalysisReportProps } from "@/types";

/**
 * 分析报告组件
 * 显示股票分析的最终结果报告
 */
const AnalysisReport: React.FC<AnalysisReportProps> = ({
  stockCode,
  onReset,
}) => {
  return (
    <div className="space-y-6">
      {/* 报告标题 */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          分析报告: {stockCode}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          生成于: {new Date().toLocaleString("zh-CN")}
        </p>
      </div>

      {/* 报告内容 */}
      <div className="p-6 rounded-xl border bg-card supports-[backdrop-filter]:bg-card/60 backdrop-blur text-sm md:text-base leading-7 space-y-3">
        <h3 className="font-semibold text-foreground">摘要</h3>
        <p className="text-muted-foreground">
          根据对 <strong>{stockCode}</strong>{" "}
          的综合分析，我们发现该公司基本面稳健，近期技术指标显示出积极信号。市场情绪乐观，但需注意宏观经济波动带来的潜在风险。
        </p>

        <h3 className="font-semibold text-foreground mt-4">关键指标</h3>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>
            <span className="text-foreground font-medium">市盈率 (P/E):</span> 25.4x (行业平均: 22.1x)
          </li>
          <li>
            <span className="text-foreground font-medium">股息率:</span> 1.8%
          </li>
          <li>
            <span className="text-foreground font-medium">技术趋势:</span>{" "}
            50日均线向上穿越200日均线，形成 &quot;黄金交叉&quot;。
          </li>
        </ul>
      </div>

      {/* 重置按钮 */}
      <Button onClick={onReset} variant="secondary" size="lg" className="px-6">
        <RefreshCw className="mr-2 h-5 w-5" />
        分析新的股票
      </Button>
    </div>
  );
};

export default AnalysisReport;
