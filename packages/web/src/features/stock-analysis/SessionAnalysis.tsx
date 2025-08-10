"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProgressTracker from "@/components/ProgressTracker";
import AnalysisReport from "@/components/AnalysisReport";
import { useStockAnalysis } from "@/hooks/useStockAnalysis";
import { usePathname } from "next/navigation";

interface SessionAnalysisProps {
  initialSymbol?: string;
  analysisId?: string;
}

const SessionAnalysis: React.FC<SessionAnalysisProps> = ({ initialSymbol, analysisId }) => {
  const pathname = usePathname();
  const {
    status,
    stockCode,
    steps,
    progress,
    handleStartAnalysis: startAnalysisSSE,
    handleReset,
    isStepsLoaded,
  } = useStockAnalysis();

  const startedRef = React.useRef(false);
  React.useEffect(() => {
    if (initialSymbol && status === "idle" && isStepsLoaded && !startedRef.current) {
      startedRef.current = true;
      startAnalysisSSE(initialSymbol, analysisId);
      if (typeof window !== "undefined" && pathname) {
        window.history.replaceState(null, "", pathname);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSymbol, analysisId, status, isStepsLoaded, pathname]);

  const renderContent = () => {
    switch (status) {
      case "processing":
        return <ProgressTracker steps={steps} overallProgress={progress} />;
      case "complete":
        return <AnalysisReport stockCode={stockCode} onReset={handleReset} />;
      case "idle":
      default:
        return (
          <div className="text-center text-muted-foreground py-6">
            即将开始分析，请稍候...
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center px-6 py-10">
      <Card className="w-full max-w-3xl border-border/60 shadow-lg supports-[backdrop-filter]:bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-center text-2xl md:text-3xl font-semibold tracking-tight">
            智能分析 Agent
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            正在为您生成深度分析报告
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
};

export default SessionAnalysis;
