/**
 * @file 基本面分析 API 路由
 * @description 提供基本面分析的后端 API 接口
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeFundamentals } from "@core";
import { FundamentalsAnalystProps } from "@core/types";

/**
 * POST 处理函数 - 处理基本面分析请求
 * 
 * @param request - Next.js 请求对象
 * @returns - 包含分析结果的响应
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const requestData: FundamentalsAnalystProps = await request.json();
    
    // 调用分析函数
    const result = await analyzeFundamentals(requestData);
    
    // 返回分析结果
    return NextResponse.json(result);
  } catch (error) {
    console.error("基本面分析 API 错误:", error);
    return NextResponse.json(
      { error: "处理基本面分析请求时出错" },
      { status: 500 }
    );
  }
}
