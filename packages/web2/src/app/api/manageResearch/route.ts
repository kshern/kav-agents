/**
 * @file 研究管理 API 路由
 * @description 提供研究管理的后端 API 接口
 */

import { NextRequest, NextResponse } from "next/server";
import { manageResearch } from "@core";
import { Model } from "@core/types";
import { InvestDebateState } from "@core/models/agentStates";

/**
 * 请求参数接口定义
 */
interface ManageResearchRequest {
  investment_debate_state: InvestDebateState;
  modelConfig: Model;
}

/**
 * POST 处理函数 - 处理研究管理请求
 * 
 * @param request - Next.js 请求对象
 * @returns - 包含研究结果的响应
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const requestData: ManageResearchRequest = await request.json();
    
    // 调用研究管理函数
    const result = await manageResearch(requestData);
    
    // 返回研究结果
    return NextResponse.json(result);
  } catch (error) {
    console.error("研究管理 API 错误:", error);
    return NextResponse.json(
      { error: "处理研究管理请求时出错" },
      { status: 500 }
    );
  }
}
