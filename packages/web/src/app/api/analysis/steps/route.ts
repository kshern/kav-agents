import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/server/supabase/client";
import { TradeAgent } from "@core/server";

/**
 * GET /api/analysis/steps
 * 获取 TradeAgent 的分析步骤配置
 */
export async function GET(req: NextRequest) {
  try {
    // 鉴权：仅登录用户可获取步骤配置（Supabase 会话）
    const res = new NextResponse();
    const supabase = createSupabaseServerClient(req, res);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return new NextResponse(JSON.stringify({ success: false, error: "未登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...Object.fromEntries(res.headers) },
      });
    }
    // 从 TradeAgent 获取步骤配置
    const steps = TradeAgent.getAnalysisSteps();

    return new NextResponse(JSON.stringify({ success: true, data: steps }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...Object.fromEntries(res.headers) },
    });
  } catch (error) {
    console.error("获取分析步骤配置失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取分析步骤配置失败",
      },
      { status: 500 },
    );
  }
}
