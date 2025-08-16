"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ListItem {
  analysisId: string;
  symbol?: string;
  firstTs?: string;
  lastTs?: string;
  count?: number;
  size?: number;
}

export default function AdminAnalysisListPage() {
  const [items, setItems] = React.useState<ListItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analysis/cache?type=list`, { cache: "no-store" });
      const json = await res.json();
      if (json?.success) setItems(json.data as ListItem[]);
    } catch (e) {
      console.error("加载会话列表失败", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="container mx-auto max-w-5xl py-6">
      <Card className="border-border/60 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">分析会话列表（Admin）</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">{loading ? "加载中…" : "暂无会话，运行一次分析后再来查看。"}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-3">Analysis ID</th>
                    <th className="py-2 pr-3">Symbol</th>
                    <th className="py-2 pr-3">First</th>
                    <th className="py-2 pr-3">Last</th>
                    <th className="py-2 pr-3">Lines</th>
                    <th className="py-2 pr-3">Size</th>
                    <th className="py-2 pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.analysisId} className="border-b last:border-b-0">
                      <td className="py-2 pr-3 font-mono text-xs md:text-sm">
                        <span className="inline-block max-w-[280px] truncate align-bottom" title={it.analysisId}>{it.analysisId}</span>
                      </td>
                      <td className="py-2 pr-3">{it.symbol ?? "-"}</td>
                      <td className="py-2 pr-3">{it.firstTs ? new Date(it.firstTs).toLocaleString() : "-"}</td>
                      <td className="py-2 pr-3">{it.lastTs ? new Date(it.lastTs).toLocaleString() : "-"}</td>
                      <td className="py-2 pr-3">{it.count ?? 0}</td>
                      <td className="py-2 pr-3">{typeof it.size === "number" ? `${(it.size / 1024).toFixed(1)} KB` : "-"}</td>
                      <td className="py-2 pr-3">
                        <Link href={`/admin/analysis/${encodeURIComponent(it.analysisId)}`} className="text-primary hover:underline">
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
