import { NextRequest, NextResponse } from "next/server";
import { TradeAgent, ProgressEvent } from "@core/server";
import { appendEvent } from "@/server/analysisStore";

export const runtime = "nodejs";

/**
 * GET /api/analysis/stream?symbol=xxx
 * 开始股票分析并通过 Server-Sent Events 实时推送进度
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const analysisId = searchParams.get("analysisId");

  if (!symbol) {
    return NextResponse.json({ error: "股票代码不能为空" }, { status: 400 });
  }
  if (!analysisId) {
    return NextResponse.json({ error: "analysisId 不能为空" }, { status: 400 });
  }

  // 设置 SSE 响应头
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  const encoder = new TextEncoder();

  // 统一存储接口封装（JSONL/SQL 可替换）
  const writeLine = async (type: "started" | "progress" | "final" | "error" | "aborted", event?: unknown) => {
    try {
      await appendEvent(analysisId, symbol, type, event);
    } catch {}
  };

  // 创建可读流用于 SSE
  const stream = new ReadableStream({
    start(controller) {
      const tradeAgent = new TradeAgent();
      let aborted = false;

      // 监听进度事件
      const progressListener = (event: ProgressEvent) => {
        if (aborted) return;
        try {
          // 持久化每条进度事件
          void writeLine("progress", event);
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {}
      };
      tradeAgent.onProgress(progressListener);

      // 立即发送一个“started”事件，确保前端立即收到首包，便于网络面板可见
      try {
        const started = {
          stepId: "started",
          stepText: "分析开始",
          status: "started" as const,
          progress: 0,
        } satisfies ProgressEvent;
        void writeLine("started", started);
        const data = `data: ${JSON.stringify(started)}\n\n`;
        controller.enqueue(encoder.encode(data));
      } catch {}

      // 心跳保活（每 25s 一次）
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`:heartbeat\n\n`));
      }, 25_000);

      // 取消处理：客户端断开时终止任务
      const onAbort = () => {
        aborted = true;
        clearInterval(heartbeat);
        tradeAgent.offProgress(progressListener);
        // 记录取消
        void writeLine("aborted");
        try {
          controller.close();
        } catch {}
      };
      request.signal.addEventListener("abort", onAbort, { once: true });

      // 开始分析
      tradeAgent
        .run({ symbol }, { signal: request.signal })
        .then((results: unknown[]) => {
          if (aborted) return;
          // 发送最终完成事件
          const finalEvent = {
            stepId: "final",
            stepText: "分析完成",
            status: "completed" as const,
            progress: 100,
            result: results,
          };
          try {
            void writeLine("final", finalEvent);
            const data = `data: ${JSON.stringify(finalEvent)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch {}
        })
        .catch((error: unknown) => {
          if (aborted) return; // 客户端已断开，避免再写入
          // 若是取消，发送终止提示；否则发送错误事件
          const isAbort = error instanceof Error && error.message === "Aborted";
          if (isAbort) return; // 取消场景不再写入，直接静默结束
          const payload = {
            stepId: "error",
            stepText: "分析失败",
            status: "error" as const,
            progress: 0,
            error: error instanceof Error ? error.message : String(error),
          };
          try {
            void writeLine("error", payload);
            const data = `data: ${JSON.stringify(payload)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch {}
        })
        .finally(() => {
          clearInterval(heartbeat);
          tradeAgent.offProgress(progressListener);
          request.signal.removeEventListener("abort", onAbort);
          if (aborted) return;
          try {
            controller.close();
          } catch {}
        });
    },
  });

  return new NextResponse(stream, { headers });
}
