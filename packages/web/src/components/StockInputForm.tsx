import React, { useState } from "react";
import classnames from "classnames/bind"; // 引入绑定工具，统一组件根级样式
import styles from "./StockInputForm.module.scss"; // 组件级样式模块，仅承载根容器间距
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Rocket } from "lucide-react";
import { StockInputFormProps } from "@/types";

/**
 * 股票输入表单组件
 * 用于输入股票代码并提交分析请求
 */
const cn = classnames.bind(styles);

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
    // 组件根容器的间距改由 SCSS Module 管理
    <form onSubmit={handleSubmit} className={cn("root")}>
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
