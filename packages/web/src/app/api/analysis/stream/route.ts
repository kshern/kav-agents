import { NextRequest, NextResponse } from 'next/server';
import { TradeAgent, ProgressEvent } from '@core/server';

/**
 * GET /api/analysis/stream?symbol=xxx
 * 开始股票分析并通过 Server-Sent Events 实时推送进度
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: '股票代码不能为空' }, { status: 400 });
  }

  // 设置 SSE 响应头
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  // 创建可读流用于 SSE
  const stream = new ReadableStream({
    start(controller) {
      const tradeAgent = new TradeAgent();

      // 监听进度事件
      const progressListener = (event: ProgressEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      };

      tradeAgent.onProgress(progressListener);

      // 开始分析
      tradeAgent.run({ symbol })
        .then((results: unknown[]) => {
          // 发送最终完成事件
          const finalEvent = {
            stepId: 'final',
            stepText: '分析完成',
            status: 'completed' as const,
            progress: 100,
            result: results,
          };
          const data = `data: ${JSON.stringify(finalEvent)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
          
          // 关闭连接
          controller.close();
        })
        .catch((error: unknown) => {
          // 发送错误事件
          const errorEvent = {
            stepId: 'error',
            stepText: '分析失败',
            status: 'error' as const,
            progress: 0,
            error: error instanceof Error ? error.message : String(error),
          };
          const data = `data: ${JSON.stringify(errorEvent)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
          
          // 关闭连接
          controller.close();
        })
        .finally(() => {
          // 清理事件监听器
          tradeAgent.offProgress(progressListener);
        });
    },
  });

  return new NextResponse(stream, { headers });
}
