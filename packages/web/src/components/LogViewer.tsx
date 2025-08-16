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

  // 每条事件支持折叠/展开
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const toggleCollapsed = React.useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // 分组视图控制
  const [groupEvents, setGroupEvents] = React.useState<boolean>(true);
  const [groupCollapsed, setGroupCollapsed] = React.useState<Record<string, boolean>>({});
  const toggleGroupCollapsed = React.useCallback((key: string) => {
    setGroupCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // 步骤日志分组控制（按 ability）
  const [groupSteps, setGroupSteps] = React.useState<boolean>(true);
  const [stepGroupCollapsed, setStepGroupCollapsed] = React.useState<Record<string, boolean>>({});
  const toggleStepGroupCollapsed = React.useCallback((key: string) => {
    setStepGroupCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

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

  // 事件分组：若为辩论（itemType === "debate"）统一归入“辩论”分组；否则优先使用 ability；再其次步骤文本/ID；系统事件归为 System/Final/Error/Started
  const groupedEvents = React.useMemo(() => {
    if (!groupEvents) return null;
    const map = new Map<string, StoredLine[]>();
    for (const line of filteredEvents) {
      const type = (line.payload as { type?: string } | undefined)?.type;
      let key = "Unknown";
      if (type === "aborted") {
        key = "System";
      } else {
        const ev = (line.payload as { event?: unknown } | undefined)?.event as
          | { itemType?: string; debateGroup?: string; debateMemberText?: string; debateMemberId?: string; stepId?: string; stepText?: string; ability?: string }
          | undefined;
        // 辩论按 debateGroup 分组
        if (ev?.itemType === "debate") {
          key = ev.debateGroup || "辩论";
        } else if (ev?.ability && typeof ev.ability === "string" && ev.ability.trim()) {
          key = ev.ability;
        } else if (ev?.stepId) {
          if (ev.stepId === "final") key = "Final";
          else if (ev.stepId === "started") key = "Started";
          else if (ev.stepId === "error") key = "Error";
          else key = ev.stepText || ev.stepId;
        } else if (type) {
          key = type;
        }
      }
      const arr = map.get(key) ?? [];
      arr.push(line);
      map.set(key, arr);
    }
    // 保持原始日志顺序（按照 filteredEvents 遍历顺序插入 Map 与组内数组）
    return Array.from(map.entries());
  }, [filteredEvents, groupEvents]);

  // 步骤日志分组：按 data.ability；缺省为 "unknown"
  type StepLogEntry = { timestamp?: string; level?: string; scope?: string; message?: string; data?: Record<string, unknown> };
  const groupedSteps = React.useMemo(() => {
    if (!groupSteps) return null;
    const map = new Map<string, unknown[]>();
    for (const row of steps) {
      const entry = row as StepLogEntry;
      const ability = (entry?.data?.ability as string | undefined) || "unknown";
      const arr = map.get(ability) ?? [];
      arr.push(row);
      map.set(ability, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [steps, groupSteps]);

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
          <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
            <input type="checkbox" checked={groupEvents} onChange={(e) => setGroupEvents(e.target.checked)} />
            <span>分组视图</span>
          </label>
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
          {!groupEvents && filteredEvents.map((line, idx) => {
            const type = line.payload?.type as AnalysisEventType | undefined;
            const tone = type === "error" ? "error" : type === "final" ? "success" : type === "aborted" ? "warn" : "default";
            const key = `${line.ts}-${idx}`;
            const isCollapsed = !!collapsed[key];
            const caret = isCollapsed ? "▸" : "▾";
            return (
              <div key={key} className="p-3 rounded border border-border/40 bg-card/60">
                <div
                  className="flex items-center justify-between gap-2 mb-2 cursor-pointer select-none"
                  onClick={() => toggleCollapsed(key)}
                  role="button"
                  aria-expanded={!isCollapsed}
                  title="点击折叠/展开"
                >
                  <div className="flex items-center gap-2">
                    <Tag tone={tone}>{type ?? "unknown"}</Tag>
                    <span className="text-xs text-muted-foreground">{new Date(line.ts).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{line.symbol}</span>
                    <span className="text-xs text-muted-foreground">{caret}</span>
                  </div>
                </div>
                {!isCollapsed && <PrettyJson value={line.payload} />}
              </div>
            );
          })}

          {groupEvents && groupedEvents && groupedEvents.map(([group, lines]) => {
            const gKey = `g-${group}`;
            const isGCollapsed = !!groupCollapsed[gKey];
            const caret = isGCollapsed ? "▸" : "▾";
            return (
              <div key={gKey} className="rounded border border-border/50">
                <div
                  className="flex items-center justify-between px-3 py-2 bg-muted/40 cursor-pointer select-none"
                  onClick={() => toggleGroupCollapsed(gKey)}
                  role="button"
                  aria-expanded={!isGCollapsed}
                  title="点击折叠/展开分组"
                >
                  <div className="text-sm font-medium truncate">{group}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{lines.length} 条</span>
                    <span className="text-xs text-muted-foreground">{caret}</span>
                  </div>
                </div>
                {!isGCollapsed && (
                  <div className="space-y-3 p-3">
                    {lines.map((line, idx) => {
                      const type = line.payload?.type as AnalysisEventType | undefined;
                      const tone = type === "error" ? "error" : type === "final" ? "success" : type === "aborted" ? "warn" : "default";
                      const key = `${line.ts}-${idx}`;
                      const isCollapsed = !!collapsed[key];
                      const caret = isCollapsed ? "▸" : "▾";
                      return (
                        <div key={key} className="p-3 rounded border border-border/40 bg-card/60">
                          <div
                            className="flex items-center justify-between gap-2 mb-2 cursor-pointer select-none"
                            onClick={() => toggleCollapsed(key)}
                            role="button"
                            aria-expanded={!isCollapsed}
                            title="点击折叠/展开"
                          >
                            <div className="flex items-center gap-2">
                              <Tag tone={tone}>{type ?? "unknown"}</Tag>
                              <span className="text-xs text-muted-foreground">{new Date(line.ts).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{line.symbol}</span>
                              <span className="text-xs text-muted-foreground">{caret}</span>
                            </div>
                          </div>
                          {!isCollapsed && <PrettyJson value={line.payload} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">步骤详细日志（原始 / 按能力分组）</div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
                <input type="checkbox" checked={groupSteps} onChange={(e) => setGroupSteps(e.target.checked)} />
                <span>按 ability 分组</span>
              </label>
              <div className="text-xs text-muted-foreground">共 {steps.length} 行</div>
            </div>
          </div>
          <div className="space-y-3">
            {steps.length === 0 && (
              <div className="text-sm text-muted-foreground">暂无步骤日志（.steps.jsonl）。</div>
            )}

            {!groupSteps && steps.slice(0, 100).map((row, i) => (
              <div key={i} className="p-3 rounded border border-border/40 bg-card/50">
                <PrettyJson value={row} />
              </div>
            ))}
            {!groupSteps && steps.length > 100 && (
              <div className="text-xs text-muted-foreground">仅展示前 100 行，其余请下载文件查看。</div>
            )}

            {groupSteps && groupedSteps && groupedSteps.map(([ability, rows]) => {
              const gKey = `steps-${ability}`;
              const isCollapsed = !!stepGroupCollapsed[gKey];
              const caret = isCollapsed ? "▸" : "▾";
              // 限制每组展示数量，避免 DOM 过大
              const preview = rows.slice(0, 50);
              return (
                <div key={gKey} className="rounded border border-border/50">
                  <div
                    className="flex items-center justify-between px-3 py-2 bg-muted/40 cursor-pointer select-none"
                    onClick={() => toggleStepGroupCollapsed(gKey)}
                    role="button"
                    aria-expanded={!isCollapsed}
                    title="点击折叠/展开分组"
                  >
                    <div className="text-sm font-medium truncate">{ability}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{rows.length} 行</span>
                      <span className="text-xs text-muted-foreground">{caret}</span>
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div className="space-y-3 p-3">
                      {preview.map((row, i) => (
                        <div key={i} className="p-3 rounded border border-border/40 bg-card/50">
                          <PrettyJson value={row} />
                        </div>
                      ))}
                      {rows.length > preview.length && (
                        <div className="text-xs text-muted-foreground">仅展示本组前 {preview.length} 行，其余请下载文件查看。</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogViewer;
