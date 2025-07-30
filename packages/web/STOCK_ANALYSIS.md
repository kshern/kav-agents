# 股票分析功能模块文档

> 本文档描述了股票分析功能模块的架构设计、组件结构和使用方法。

## 1. 功能概述

股票分析模块提供了一个完整的股票分析流程界面，包括：
- 股票代码输入
- 分析进度实时跟踪
- 分析结果展示

整个模块采用了基于特性（Feature-based）的目录结构，遵循关注点分离原则，将UI组件、业务逻辑和状态管理清晰分开。

## 2. 目录结构

```
src/
├─ features/
│  └─ stock-analysis/             # 股票分析功能模块
│     ├─ components/              # 业务组件
│     │  ├─ StockInputForm.tsx    # 股票输入表单
│     │  ├─ ProgressTracker/      # 进度跟踪组件
│     │  │  ├─ index.tsx          # 进度跟踪器主组件
│     │  │  └─ StepItem.tsx       # 单个步骤项组件
│     │  └─ AnalysisReport.tsx    # 分析报告组件
│     ├─ hooks/
│     │  └─ useStockAnalysis.ts   # 股票分析状态管理Hook
│     ├─ types.ts                 # 类型定义
│     └─ index.tsx                # 模块主入口与导出
└─ app/
   └─ stock-analysis/
      └─ page.tsx                 # 页面路由组件
```

## 3. 核心组件

### 3.1 StockInputForm

股票代码输入表单组件，负责收集用户输入的股票代码并提交分析请求。

**主要特性：**
- 表单验证（非空检查）
- 加载状态处理
- 提交事件处理

### 3.2 ProgressTracker

分析进度跟踪组件，显示整体进度条和各个步骤的状态。

**主要特性：**
- 整体进度百分比显示
- 步骤列表展示（带状态指示）
- 当前执行步骤高亮

### 3.3 AnalysisReport

分析结果展示组件，以结构化方式展示股票分析报告。

**主要特性：**
- 报告标题与时间戳
- 分析摘要
- 关键指标列表
- 重新分析按钮

## 4. 业务逻辑

### 4.1 useStockAnalysis Hook

封装了整个股票分析流程的状态管理和业务逻辑。

**主要功能：**
- 管理分析状态（idle/processing/complete）
- 处理步骤状态更新
- 模拟分析过程（可替换为实际API调用）
- 提供开始分析和重置功能

## 5. 使用方法

### 5.1 基本用法

```tsx
import StockAnalysis from '@/features/stock-analysis';

export default function StockAnalysisPage() {
    return <StockAnalysis />;
}
```

### 5.2 使用单独组件

```tsx
import { StockInputForm, ProgressTracker, AnalysisReport, useStockAnalysis } from '@/features/stock-analysis';

export default function CustomPage() {
    const { status, steps, progress, handleStartAnalysis } = useStockAnalysis();
    
    // 自定义渲染逻辑
    return (
        <div>
            <StockInputForm onSubmit={handleStartAnalysis} isLoading={status === 'processing'} />
            {status === 'processing' && <ProgressTracker steps={steps} overallProgress={progress} />}
        </div>
    );
}
```

## 6. 未来扩展

- **API集成**：替换模拟逻辑为实际后端API调用
- **更多分析类型**：添加技术分析、基本面分析等不同类型
- **数据可视化**：集成图表库展示分析结果
- **历史记录**：保存用户的分析历史

## 7. 贡献指南

1. 遵循现有的组件和目录结构
2. 确保添加适当的类型定义
3. 保持关注点分离原则
4. 为新功能编写文档

---

> 本文档将随着功能的迭代更新
