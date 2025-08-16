import React from "react";
import Link from "next/link";
import LogViewer from "@/components/LogViewer";

interface PageProps {
  params: Promise<{ analysisId: string }>;
}

export default async function AdminAnalysisDetailPage({ params }: PageProps) {
  const { analysisId } = await params;
  return (
    <div className="container mx-auto max-w-5xl py-6 space-y-4">
      <div className="text-sm text-muted-foreground">
        <Link href="/admin/analysis" className="hover:underline">返回列表</Link>
        <span className="mx-2">/</span>
        <span className="font-mono">{analysisId}</span>
      </div>
      <LogViewer analysisId={analysisId} />
    </div>
  );
}
