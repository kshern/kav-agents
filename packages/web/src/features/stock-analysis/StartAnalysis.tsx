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

  // 提交后创建会话并跳转到 /stock-analysis/[analysisId]?symbol=...
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
      router.push(`/stock-analysis/${analysisId}?symbol=${encodeURIComponent(code)}`);
    } catch (e) {
      console.error("创建分析会话失败:", e);
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
            输入代码，启动AI为您生成深度分析报告
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockInputForm onSubmit={handleSubmitStart} isLoading={false} />
        </CardContent>
      </Card>
    </div>
  );
};

export default StartAnalysis;
