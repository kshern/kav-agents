
import { analyzeFundamentals, analyzeMarket, Button } from '@core';
import './App.scss';
import { useState } from 'react';


function App() {
  const [fundamentalsReport, setFundamentalsReport] = useState('');
  const [marketReport, setMarketReport] = useState('');

  const handleAnalyzeFundamentals = async () => {
    const result = await analyzeFundamentals({ company_of_interest: 'AAPL', trade_date: '2025-07-24' });
    setFundamentalsReport(result.fundamentals_report);
  };
  const handleAnalyzeMarket = async () => {
    const result = await analyzeMarket({ company_of_interest: 'AAPL', trade_date: '2025-07-24' });
    setMarketReport(result.market_report);
  };
  return (
    <div className="App">
      <Button onClick={handleAnalyzeFundamentals}>Button</Button>
      <Button onClick={handleAnalyzeMarket}>Button2</Button>
      <p>{fundamentalsReport}</p>
      <p>{marketReport}</p>
    </div>
  );
}

export default App;
