import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Rocket } from 'lucide-react';
import { StockInputFormProps } from '../types';

/**
 * 股票输入表单组件
 * 用于输入股票代码并提交分析请求
 */
const StockInputForm: React.FC<StockInputFormProps> = ({ onSubmit, isLoading }) => {
    const [stockCode, setStockCode] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (stockCode.trim()) {
            onSubmit(stockCode.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                type="text"
                placeholder="例如: AAPL, 00700.HK, 600519.SS"
                value={stockCode}
                onChange={(e) => setStockCode(e.target.value)}
                disabled={isLoading}
                className="text-lg py-6"
            />
            <Button type="submit" disabled={isLoading || !stockCode.trim()} className="text-lg py-6">
                {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <Rocket className="mr-2 h-5 w-5" />
                )}
                开始分析
            </Button>
        </form>
    );
};

export default StockInputForm;
