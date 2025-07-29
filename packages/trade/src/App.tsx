
import { analyzeFundamentals } from '@core/server';
import './App.scss';
import { useState } from 'react';
import { Button } from '@core';


function App() {
  const [fundamentalsReport, setFundamentalsReport] = useState('');
  const [marketReport, setMarketReport] = useState('');
  const [newsReport, setNewsReport] = useState('');
  const [researchReport, setResearchReport] = useState('');

  const handleAnalyzeFundamentals = async () => {
    const result = await analyzeFundamentals({ company_of_interest: 'AAPL', modelConfig: { model_name: 'gemini-2.5-flash' }, trade_date: '2025-07-24' });
    setFundamentalsReport(result.fundamentals_report);
  };
  // const handleAnalyzeMarket = async () => {
  //   const result = await analyzeMarket({ company_of_interest: 'AAPL', modelConfig: { model_name: 'gemini-2.5-flash' }, trade_date: '2025-07-24' });
  //   setMarketReport(result.market_report);
  // };
  // const handleAnalyzeNews = async () => {
  //   const result = await analyzeNews({ company_of_interest: 'AAPL', modelConfig: { model_name: 'gemini-2.5-flash' }, trade_date: '2025-07-24' });
  //   setNewsReport(result.news_report);
  // };
  // const handleAnalyzeResearch = async () => {
  //   const result = await manageResearch({
  //     investment_debate_state: {
  //       bull_history: "",
  //       bear_history: "",
  //       history: [],
  //       current_response: "",
  //       judge_decision: "",
  //       count: 0,
  //     },
  //     modelConfig: { model_name: "gemini-2.5-flash" },
  //   });
  //   setResearchReport(result.investment_plan);
  // };
  return (
    <div className="App">
      <Button onClick={handleAnalyzeFundamentals}>Fundamentals</Button>
      {/* <Button onClick={handleAnalyzeMarket}>Market</Button>
      <Button onClick={handleAnalyzeNews}>News</Button>
      <Button onClick={handleAnalyzeResearch}>Research</Button> */}
      <p>{fundamentalsReport}</p>
      <p>{marketReport}</p>
      <p>{newsReport}</p>
      <p>{researchReport}</p>
    </div>
  );
}

export default App;
