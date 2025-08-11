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
    handleStartAnalysis,
    isStepsLoaded,
  } = useStockAnalysis();

  const startedRef = React.useRef(false);
  React.useEffect(() => {
    if (isStepsLoaded && !startedRef.current) {
      startedRef.current = true;
      handleStartAnalysis(analysisId);
      if (typeof window !== "undefined" && pathname) {
        window.history.replaceState(null, "", pathname);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId, isStepsLoaded, pathname]);


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
        <CardContent><ProgressTracker steps={steps} overallProgress={progress} /></CardContent>
      </Card>
    </div>
  );
};

export default SessionAnalysis;
