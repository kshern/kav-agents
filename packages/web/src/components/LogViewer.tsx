"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AnalysisEventType = "started" | "progress" | "final" | "error" | "aborted";

interface StoredLine<T = unknown> {
  analysisId: string;
  symbol: string;
  ts: string; // ISO timestamp
  payload: { type: AnalysisEventType; event?: T } | { type: "aborted" };
}

interface LogViewerProps {
  analysisId: string;
}

const PrettyJson: React.FC<{ value: unknown }> = ({ value }) => {
  const json = React.useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);
  return (
    <pre className="text-xs md:text-sm whitespace-pre-wrap break-words bg-muted/30 rounded p-3 border border-border/40 overflow-auto max-h-80">
      {json}
    </pre>
  );
};

const Tag: React.FC<{ children: React.ReactNode; tone?: "default" | "error" | "success" | "warn" }>
  = ({ children, tone = "default" }) => {
  const toneCls =
    tone === "error" ? "bg-red-500/10 text-red-600 border-red-500/30" :
    tone === "success" ? "bg-green-500/10 text-green-600 border-green-500/30" :
    tone === "warn" ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" :
    "bg-muted/50 text-foreground/80 border-border/40";
  return <span className={`text-xs px-2 py-0.5 rounded border ${toneCls}`}>{children}</span>;
};

const LogViewer: React.FC<LogViewerProps> = ({ analysisId }) => {
  const [events, setEvents] = React.useState<StoredLine[]>([]);
  const [steps, setSteps] = React.useState<unknown[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filterText, setFilterText] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<Record<AnalysisEventType, boolean>>({
    started: true,
    progress: true,
    final: true,
    error: true,
    aborted: true,
  });

  const fetchAll = React.useCallback(async () => {
    if (!analysisId) return;
    setLoading(true);
    try {
      const [evRes, stRes] = await Promise.all([
        fetch(`/api/analysis/cache?analysisId=${encodeURIComponent(analysisId)}`),
        fetch(`/api/analysis/cache?analysisId=${encodeURIComponent(analysisId)}&type=steps`),
      ]);
      const evJson = await evRes.json();
      const stJson = await stRes.json();
      if (evJson?.success) setEvents(evJson.data as StoredLine[]);
      if (stJson?.success) setSteps(stJson.data as unknown[]);
    } catch (e) {
      console.error("加载日志失败", e);
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  React.useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const filteredEvents = React.useMemo(() => {
    const kw = filterText.trim().toLowerCase();
    return events.filter((line) => {
      const type = line.payload?.type as AnalysisEventType | undefined;
      if (type && !typeFilter[type]) return false;
      if (!kw) return true;
      const hay = `${line.ts}\n${line.symbol}\n${JSON.stringify(line.payload ?? {})}`.toLowerCase();
      return hay.includes(kw);
    });
  }, [events, filterText, typeFilter]);

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base md:text-lg">执行日志</CardTitle>
        <div className="flex items-center gap-2">
          <input
            className="px-2 py-1 text-sm rounded border bg-background"
            placeholder="搜索关键词…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          <Button variant="secondary" size="sm" onClick={() => void fetchAll()} disabled={loading}>
            {loading ? "刷新中…" : "刷新"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {(["started", "progress", "final", "error", "aborted"] as AnalysisEventType[]).map((t) => (
            <label key={t} className="flex items-center gap-1 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={typeFilter[t]}
                onChange={(e) => setTypeFilter((prev) => ({ ...prev, [t]: e.target.checked }))}
              />
              <Tag tone={t === "error" ? "error" : t === "final" ? "success" : t === "aborted" ? "warn" : "default"}>{t}</Tag>
            </label>
          ))}
        </div>

        <div className="space-y-3">
          {filteredEvents.length === 0 && (
            <div className="text-sm text-muted-foreground">暂无事件。启动一次分析或稍后再试。</div>
          )}
          {filteredEvents.map((line, idx) => {
            const type = line.payload?.type as AnalysisEventType | undefined;
            const tone = type === "error" ? "error" : type === "final" ? "success" : type === "aborted" ? "warn" : "default";
            return (
              <div key={`${line.ts}-${idx}`} className="p-3 rounded border border-border/40 bg-card/60">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Tag tone={tone}>{type ?? "unknown"}</Tag>
                    <span className="text-xs text-muted-foreground">{new Date(line.ts).toLocaleString()}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{line.symbol}</span>
                </div>
                <PrettyJson value={line.payload} />
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">步骤详细日志（原始）</div>
            <div className="text-xs text-muted-foreground">共 {steps.length} 行</div>
          </div>
          <div className="space-y-3">
            {steps.length === 0 && (
              <div className="text-sm text-muted-foreground">暂无步骤日志（.steps.jsonl）。</div>
            )}
            {steps.slice(0, 100).map((row, i) => (
              <div key={i} className="p-3 rounded border border-border/40 bg-card/50">
                <PrettyJson value={row} />
              </div>
            ))}
            {steps.length > 100 && (
              <div className="text-xs text-muted-foreground">仅展示前 100 行，其余请下载文件查看。</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogViewer;
