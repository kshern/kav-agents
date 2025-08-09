import React from "react";
import SessionAnalysis from "@/features/stock-analysis/SessionAnalysis";

interface PageProps {
  params: { analysisId: string };
  searchParams: Promise<{ symbol?: string | string[] } | undefined>;
}

export default async function AnalysisDetailPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const sym = sp?.symbol;
  const initialSymbol = Array.isArray(sym) ? sym[0] : sym;
  return <SessionAnalysis initialSymbol={initialSymbol} />;
}
