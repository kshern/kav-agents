"use client";

import { Button } from '@/components/ui/button';
import React from 'react';
import { useRouter } from 'next/navigation';

// 主页面组件
export default function HomePage() {
    const router = useRouter();
    
    // 跳转到股票分析页面
    const handleNavigateToStockAnalysis = () => {
        router.push('/stock-analysis');
    };

    return (
        <div className="bg-gray-50 flex items-center justify-center min-h-screen p-4">
            <Button 
                onClick={handleNavigateToStockAnalysis}
                className="text-lg py-6 bg-gray-600 text-white hover:bg-gray-700"
            >
                开始股票分析
            </Button>
        </div>
    );
}
