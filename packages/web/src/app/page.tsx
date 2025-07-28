"use client"

import { useState } from "react";
import { Button } from "@core";

export default function Home() {
  const [fundamentalsReport, setFundamentalsReport] = useState('');
  const [marketReport, setMarketReport] = useState('');
  const [newsReport, setNewsReport] = useState('');
  const [researchReport, setResearchReport] = useState('');

  const handleAnalyzeFundamentals = async () => {
    try {
      // 通过后端 API 调用分析函数
      const response = await fetch('/api/analyzeFundamentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          company_of_interest: 'AAPL', 
          modelConfig: { model_name: 'gemini-2.5-flash' }, 
          trade_date: '2025-07-24' 
        }),
      });
      
      if (!response.ok) {
        throw new Error('基本面分析请求失败');
      }
      
      const result = await response.json();
      setFundamentalsReport(result.fundamentals_report);
    } catch (error) {
      console.error('基本面分析错误:', error);
      setFundamentalsReport('获取基本面分析报告时出错');
    }
  };
  const handleAnalyzeMarket = async () => {
    try {
      // 通过后端 API 调用分析函数
      const response = await fetch('/api/analyzeMarket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          company_of_interest: 'AAPL', 
          modelConfig: { model_name: 'gemini-2.5-flash' }, 
          trade_date: '2025-07-24' 
        }),
      });
      
      if (!response.ok) {
        throw new Error('市场分析请求失败');
      }
      
      const result = await response.json();
      setMarketReport(result.market_report);
    } catch (error) {
      console.error('市场分析错误:', error);
      setMarketReport('获取市场分析报告时出错');
    }
  };
  const handleAnalyzeNews = async () => {
    try {
      // 通过后端 API 调用分析函数
      const response = await fetch('/api/analyzeNews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          company_of_interest: 'AAPL', 
          modelConfig: { model_name: 'gemini-2.5-flash' }, 
          trade_date: '2025-07-24' 
        }),
      });
      
      if (!response.ok) {
        throw new Error('新闻分析请求失败');
      }
      
      const result = await response.json();
      setNewsReport(result.news_report);
    } catch (error) {
      console.error('新闻分析错误:', error);
      setNewsReport('获取新闻分析报告时出错');
    }
  };
  const handleAnalyzeResearch = async () => {
    try {
      // 通过后端 API 调用研究管理函数
      const response = await fetch('/api/manageResearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          investment_debate_state: {
            bull_history: "",
            bear_history: "",
            history: [],
            current_response: "",
            judge_decision: "",
            count: 0,
          },
          modelConfig: { model_name: "gemini-2.5-flash" },
        }),
      });
      
      if (!response.ok) {
        throw new Error('研究管理请求失败');
      }
      
      const result = await response.json();
      setResearchReport(result.investment_plan);
    } catch (error) {
      console.error('研究管理错误:', error);
      setResearchReport('获取研究报告时出错');
    }
  };
  return (
    <div className="App">
      <Button onClick={handleAnalyzeFundamentals}>Fundamentals</Button>
      <Button onClick={handleAnalyzeMarket}>Market</Button>
      <Button onClick={handleAnalyzeNews}>News</Button>
      <Button onClick={handleAnalyzeResearch}>Research</Button>
      <p>{fundamentalsReport}</p>
      <p>{marketReport}</p>
      <p>{newsReport}</p>
      <p>{researchReport}</p>
    </div>
  );
}
