 import { Button } from "@/components/ui/button";
 import React from "react";
 import Link from "next/link";

// 主页面组件
export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center px-6">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            KAV Agents
          </h1>
          <p className="mt-3 text-base md:text-lg text-muted-foreground">
            面向专业投资者的智能研究与分析助手
          </p>
        </div>
        <Button asChild size="lg" className="px-8">
          <Link href="/stock-analysis">开始分析</Link>
        </Button>
      </div>
    </div>
  );
}
