"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StockInputForm from "@/components/StockInputForm";
import { useRouter } from "next/navigation";

const StartAnalysis: React.FC = () => {
  const router = useRouter();

  // 提交后创建会话并跳转到 /stock-analysis/[analysisId]
  const handleSubmitStart = async (code: string) => {
    try {
      const res = await fetch("/api/analysis/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: code }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const analysisId: string | undefined = json?.data?.analysisId;
      if (!analysisId) throw new Error("No analysisId returned");
      // 不再通过 query 传递 symbol，symbol 已在服务端会话中持久化
      router.push(`/stock-analysis/${analysisId}`);
    } catch (e) {
      console.error("创建分析会话失败:", e);
    }
  };

  return (
    // 页面级布局已由路由页 `src/app/stock-analysis/page.tsx` 管理，这里仅渲染卡片内容
    <Card className="w-full max-w-6xl xl:max-w-7xl border-border/60 shadow-lg supports-[backdrop-filter]:bg-card/80 backdrop-blur">{/* 进一步放大卡片：接近主容器宽度 */}
      <CardHeader>
        <CardTitle className="text-center text-2xl md:text-3xl font-semibold tracking-tight">
          智能分析 Agent
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          输入代码，启动AI为您生成深度分析报告
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StockInputForm onSubmit={handleSubmitStart}/>
      </CardContent>
    </Card>
  );
};

export default StartAnalysis;
