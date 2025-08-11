import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Rocket } from "lucide-react";
import { StockInputFormProps } from "@/types";

/**
 * 股票输入表单组件
 * 用于输入股票代码并提交分析请求
 */
const StockInputForm: React.FC<StockInputFormProps> = ({
  onSubmit,
}) => {
  const [stockCode, setStockCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stockCode.trim()) {
      setIsLoading(true);
      onSubmit(stockCode.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        type="text"
        placeholder="例如: AAPL, 00700.HK, 600519.SS"
        value={stockCode}
        onChange={(e) => setStockCode(e.target.value)}
        disabled={isLoading}
        className="h-12 md:h-14 text-base md:text-lg"
      />
      <div className="flex justify-center">
        <Button type="submit" size="lg" disabled={isLoading || !stockCode.trim()} className="px-8">
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Rocket className="mr-2 h-5 w-5" />
          )}
          开始分析
        </Button>
      </div>
    </form>
  );
};

export default StockInputForm;
