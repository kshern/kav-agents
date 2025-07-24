
import { analyzeFundamentals, analyzeMarket, analyzeNews, Button } from '@core';
import './App.scss';
import { useState } from 'react';


function App() {
  const [fundamentalsReport, setFundamentalsReport] = useState('');
  const [marketReport, setMarketReport] = useState('');
  const [newsReport, setNewsReport] = useState('');

  const handleAnalyzeFundamentals = async () => {
    const result = await analyzeFundamentals({ company_of_interest: 'AAPL', model_name: 'gemini-2.5-flash', trade_date: '2025-07-24' });
    setFundamentalsReport(result.fundamentals_report);
  };
  const handleAnalyzeMarket = async () => {
    const result = await analyzeMarket({ company_of_interest: 'AAPL', model_name: 'gemini-2.5-flash', trade_date: '2025-07-24' });
    setMarketReport(result.market_report);
  };
  const handleAnalyzeNews = async () => {
    const result = await analyzeNews({ company_of_interest: 'AAPL', model_name: 'gemini-2.5-flash', trade_date: '2025-07-24' });
    setNewsReport(result.news_report);
  };
  return (
    <div className="App">
      <Button onClick={handleAnalyzeFundamentals}>Fundamentals</Button>
      <Button onClick={handleAnalyzeMarket}>Market</Button>
      <Button onClick={handleAnalyzeNews}>News</Button>
      <p>{fundamentalsReport}</p>
      <p>{marketReport}</p>
      <p>{newsReport}</p>
    </div>
  );
}

export default App;
