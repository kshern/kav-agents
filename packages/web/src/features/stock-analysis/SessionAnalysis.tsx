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
  analysisId?: string;
}

const SessionAnalysis: React.FC<SessionAnalysisProps> = ({ analysisId }) => {
  const pathname = usePathname();
  const {
    status,
    steps,
    progress,
    handleStartAnalysis: startAnalysisSSE,
    handleReset,
    isStepsLoaded,
  } = useStockAnalysis();

  const startedRef = React.useRef(false);
  React.useEffect(() => {
    if (isStepsLoaded && !startedRef.current) {
      startedRef.current = true;
      startAnalysisSSE(analysisId);
      if (typeof window !== "undefined" && pathname) {
        window.history.replaceState(null, "", pathname);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId, isStepsLoaded, pathname]);

  const renderContent = () => {
    switch (status) {
      case "processing":
        return <ProgressTracker steps={steps} overallProgress={progress} />;
      case "complete":
        return <AnalysisReport onReset={handleReset} />;
      default:
        // 移除 idle 状态的占位显示：空闲态不再在此页面展示，由 StartAnalysis 页面负责启动流程与交互
        return null;
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
