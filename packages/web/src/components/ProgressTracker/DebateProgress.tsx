import React, { useMemo } from "react";
import type { AnalysisStep, StepStatus } from "@/types";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DebateProgressProps {
  steps: AnalysisStep[];
}

// 将连续的辩论步骤分组为“回合”
function groupDebateRounds(steps: AnalysisStep[]) {
  // 识别形如 `*_r1`、`*_r2` 的步骤为辩论步骤，并按轮次分组
  const roundsMap = new Map<number, AnalysisStep[]>();

  for (const step of steps) {
    const match = step.id.match(/_r(\d+)$/i);
    if (!match) continue;
    const round = parseInt(match[1], 10);
    if (!roundsMap.has(round)) roundsMap.set(round, []);
    roundsMap.get(round)!.push(step);
  }

  // 按轮次排序，返回 { round, items } 结构，便于渲染“第N轮”
  return Array.from([...roundsMap.keys()].sort((a, b) => a - b)).map(
    (round) => ({ round, items: roundsMap.get(round)! }),
  );
}

// 解析辩论分组键：来自后端步骤ID前缀 `${group}__${member}_rN`
function parseDebateGroup(id: string): string | null {
  if (!/_r\d+$/i.test(id)) return null;
  const idx = id.indexOf("__");
  return idx > 0 ? id.slice(0, idx) : "default";
}

// 分组显示名（可根据实际后端分组键微调）
function debateGroupLabel(group: string): string {
  const key = group.toLowerCase();
  if (key.includes("risk")) return "风险辩论";
  if (key.includes("research") || key.includes("main")) return "研究辩论";
  return "辩论分组";
}

function statusColor(status: StepStatus) {
  switch (status) {
    case "in-progress":
      return "bg-primary text-primary-foreground ring-1 ring-primary/20";
    case "completed":
      return "bg-emerald-500 text-white ring-1 ring-emerald-500/20";
    case "error":
      return "bg-destructive text-destructive-foreground ring-1 ring-destructive/20";
    default:
      return "bg-muted text-muted-foreground ring-1 ring-border";
  }
}

function getSide(id: string): "bull" | "bear" | "other" {
  const lower = id.toLowerCase();
  if (lower.startsWith("bull_researcher") || lower.includes("bull")) return "bull";
  if (lower.startsWith("bear_researcher") || lower.includes("bear")) return "bear";
  return "other";
}

function sideAwareClass(status: StepStatus, id: string) {
  const side = getSide(id);
  if (status === "pending") {
    if (side === "bull") return "bg-emerald-50 text-emerald-600 ring-emerald-200";
    if (side === "bear") return "bg-rose-50 text-rose-600 ring-rose-200";
  }
  return statusColor(status);
}

export default function DebateProgress({ steps }: DebateProgressProps) {
  // 仅保留辩论步骤，并按首次出现的顺序提取分组键序列
  const { groupsOrder, groupMap } = useMemo(() => {
    const debateSteps = steps.filter((s) => /_r\d+$/i.test(s.id));
    const order: string[] = [];
    const map = new Map<string, AnalysisStep[]>();
    for (const s of debateSteps) {
      const g = parseDebateGroup(s.id);
      if (!g) continue;
      if (!map.has(g)) {
        map.set(g, []);
        order.push(g);
      }
      map.get(g)!.push(s);
    }
    return { groupsOrder: order, groupMap: map };
  }, [steps]);

  if (!groupsOrder.length) return null;

  return (
    <div className="space-y-6">
      {groupsOrder.map((groupKey) => {
        const items = groupMap.get(groupKey)!;
        const rounds = groupDebateRounds(items);
        if (!rounds.length) return null;
        return (
          <div key={`debate-${groupKey}`} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm md:text-base font-medium text-foreground">{debateGroupLabel(groupKey)}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" /> 进行中
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> 已完成
              </div>
            </div>

            {/* 回合分段可视化（仅此分组） */}
            <div className="space-y-3">
              {rounds.map(({ round, items: roundItems }) => {
                // 按“牛/熊/其它”顺序排序，增强阅读节奏
                const ordered = roundItems.slice().sort((a, b) => {
                  const w = (s: AnalysisStep) => (getSide(s.id) === "bull" ? 0 : getSide(s.id) === "bear" ? 1 : 2);
                  const wa = w(a);
                  const wb = w(b);
                  if (wa !== wb) return wa - wb;
                  return a.id.localeCompare(b.id);
                });

                const total = ordered.length || 1;
                const done = ordered.filter((s) => s.status === "completed").length;
                const inprog = ordered.some((s) => s.status === "in-progress");
                const percent = Math.round((done / total) * 100);

                return (
                  <div key={`${groupKey}-round-${round}`} className="rounded-xl border bg-card/60 backdrop-blur px-3 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex h-6 min-w-[4rem] items-center justify-center rounded-md px-2 text-xs font-medium",
                            inprog ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "bg-muted text-muted-foreground ring-1 ring-border",
                          )}
                        >
                          第{round}轮
                        </span>
                        <span className="text-xs text-muted-foreground">{percent}%</span>
                      </div>
                    </div>

                    {/* 回合内分项（双方/多方观点） */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ordered.map((s, idx) => (
                        <span
                          key={`${s.id}-${idx}`}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors",
                            sideAwareClass(s.status, s.id),
                          )}
                          title={s.text}
                        >
                          <s.icon className="h-3.5 w-3.5 opacity-90" />
                          {s.text}
                        </span>
                      ))}
                    </div>

                    {/* 回合进度条 */}
                    <div className="mt-3">
                      <Progress value={percent} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
