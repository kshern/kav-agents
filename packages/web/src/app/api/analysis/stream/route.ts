import { NextRequest, NextResponse } from "next/server";
import { TradeAgent, ProgressEvent } from "@core/server";

/**
 * GET /api/analysis/stream?symbol=xxx
 * 开始股票分析并通过 Server-Sent Events 实时推送进度
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "股票代码不能为空" }, { status: 400 });
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

  // 创建可读流用于 SSE
  const stream = new ReadableStream({
    start(controller) {
      const tradeAgent = new TradeAgent();

      // 监听进度事件
      const progressListener = (event: ProgressEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };
      tradeAgent.onProgress(progressListener);

      // 心跳保活（每 25s 一次）
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`:heartbeat\n\n`));
      }, 25_000);

      // 取消处理：客户端断开时终止任务
      const onAbort = () => {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {}
      };
      request.signal.addEventListener("abort", onAbort, { once: true });

      // 开始分析
      tradeAgent
        .run({ symbol }, { signal: request.signal })
        .then((results: unknown[]) => {
          // 发送最终完成事件
          const finalEvent = {
            stepId: "final",
            stepText: "分析完成",
            status: "completed" as const,
            progress: 100,
            result: results,
          };
          const data = `data: ${JSON.stringify(finalEvent)}\n\n`;
          controller.enqueue(encoder.encode(data));
        })
        .catch((error: unknown) => {
          // 若是取消，发送终止提示；否则发送错误事件
          const isAbort = error instanceof Error && error.message === "Aborted";
          const payload = isAbort
            ? { stepId: "abort", stepText: "已取消", status: "error" as const, progress: 0 }
            : {
                stepId: "error",
                stepText: "分析失败",
                status: "error" as const,
                progress: 0,
                error: error instanceof Error ? error.message : String(error),
              };
          const data = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(data));
        })
        .finally(() => {
          clearInterval(heartbeat);
          tradeAgent.offProgress(progressListener);
          request.signal.removeEventListener("abort", onAbort);
          try {
            controller.close();
          } catch {}
        });
    },
  });

  return new NextResponse(stream, { headers });
}
