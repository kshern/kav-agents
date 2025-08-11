import React from "react";
import SessionAnalysis from "@/features/stock-analysis/SessionAnalysis";
import { readSessionSymbol } from "@/server/analysisSession";

interface PageProps {
  params: { analysisId: string };
}

export default async function AnalysisDetailPage({ params }: PageProps) {
  return <SessionAnalysis analysisId={params.analysisId} />;
}
