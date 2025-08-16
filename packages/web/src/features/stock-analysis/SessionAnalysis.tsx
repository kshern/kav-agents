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
import classnames from "classnames/bind"; // 引入绑定工具，统一根容器样式
import styles from "./index.module.scss"; // features 局部样式模块（卡片宽度等）

interface SessionAnalysisProps {
  analysisId?: string;
}

const cn = classnames.bind(styles);

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
    // 页面级布局已由路由页管理，这里仅渲染卡片内容
    <Card className={cn("card", "border-border/60 shadow-lg supports-[backdrop-filter]:bg-card/80 backdrop-blur")}>{/* 进一步放大卡片：与启动页一致 */}
      <CardHeader>
        <CardTitle className="text-center text-2xl md:text-3xl font-semibold tracking-tight">
          智能分析 Agent
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          正在为您生成深度分析报告
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProgressTracker steps={steps} overallProgress={progress} />
      </CardContent>
    </Card>
  );
};

export default SessionAnalysis;
