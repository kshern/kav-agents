import { NextResponse } from "next/server";
import { TradeAgent } from "@core/server";

/**
 * GET /api/analysis/steps
 * 获取 TradeAgent 的分析步骤配置
 */
export async function GET() {
  try {
    // 从 TradeAgent 获取步骤配置
    const steps = TradeAgent.getAnalysisSteps();

    return NextResponse.json({
      success: true,
      data: steps,
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
