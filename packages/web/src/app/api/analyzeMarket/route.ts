/**
 * @file 市场分析 API 路由
 * @description 提供市场分析的后端 API 接口
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeMarket } from "@core/server";
import { Model } from "@core/types";

/**
 * 请求参数接口定义
 */
interface AnalyzeMarketRequest {
  company_of_interest: string;
  modelConfig: Model;
  trade_date: string;
}

/**
 * POST 处理函数 - 处理市场分析请求
 * 
 * @param request - Next.js 请求对象
 * @returns - 包含分析结果的响应
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const requestData: AnalyzeMarketRequest = await request.json();
    
    // 调用分析函数
    const result = await analyzeMarket(requestData);
    
    // 返回分析结果
    return NextResponse.json(result);
  } catch (error) {
    console.error("市场分析 API 错误:", error);
    return NextResponse.json(
      { error: "处理市场分析请求时出错" },
      { status: 500 }
    );
  }
}
