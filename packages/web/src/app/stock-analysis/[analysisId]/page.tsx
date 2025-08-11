import React from "react";
import SessionAnalysis from "@/features/stock-analysis/SessionAnalysis";

interface PageProps {
  // Next.js 15 动态参数需要 Promise 形式，并在使用前 await
  params: Promise<{ analysisId: string }>;
}

export default async function AnalysisDetailPage({ params }: PageProps) {
  const { analysisId } = await params; // 先 await params 再取值，避免 Next.js 15 警告
  return <SessionAnalysis analysisId={analysisId} />;
}
