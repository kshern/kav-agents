// Next.js 路由处理：服务端抓取问财新闻
// 仅限 Node.js 运行时（Puppeteer 依赖 Node APIs）
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { fetchWencaiNews } from 'datasources';

// 解析查询参数中的 timeout（毫秒）
function parseTimeout(searchParams: URLSearchParams): number | undefined {
  const t = searchParams.get('timeoutMs');
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

// GET /api/wencai/news/[symbol]?timeoutMs=60000
export async function GET(
  req: Request,
  ctx: { params: { symbol: string } }
) {
  try {
    const { symbol } = ctx.params;
    const url = new URL(req.url);
    const timeoutMs = parseTimeout(url.searchParams);

    const data = await fetchWencaiNews(symbol, { timeoutMs });
    return NextResponse.json({ ok: true, symbol, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
