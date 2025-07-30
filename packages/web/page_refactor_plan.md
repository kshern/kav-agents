# Stock Analysis Page 重构规划

> 目标：将 `src/app/page.tsx` 中过于庞大的 UI 与逻辑拆分为更细粒度的 **页面** 与 **可复用组件**，并为后续功能扩展（如后端接入、状态管理）奠定基础。

---

## 1. 当前 pain points

1. `page.tsx` 文件过大（>250 行），包含页面、业务逻辑与多个内部组件，代码阅读和维护成本高。
2. 所有状态及进度模拟逻辑均耦合在同一文件，不利于单元测试与未来接入真实 API。
3. 内部组件（`StockInputForm`、`ProgressTracker`、`AnalysisReport`、`StepItem` 等）无法在其他页面或 Storybook 中复用。
4. 没有分层目录结构；业务与通用组件混杂在 `app` 目录中。

## 2. 拆分原则

- **关注点分离 (SoC)**：页面负责路由与状态切换；组件仅负责展示；业务逻辑放到 hooks 或 service 层。
- **可复用性**：通用 UI 组件放入 `src/components`；业务专属组件放入 `src/features/stock-analysis`。
- **按领域分文件夹 (Feature Folder)**：同一业务域的组件、hook、服务、测试放在同一目录，降低跨文件夹跳转。
- **可测试性**：拆分后可对每个组件编写独立测试。

## 3. 建议目录结构

```text
src/
├─ components/                # 通用 UI 组件
│  ├─ CButton/
│  ├─ CInput/
│  ├─ CProgress/
│  └─ ...
├─ features/
│  └─ stock-analysis/
│     ├─ components/
│     │  ├─ StockInputForm.tsx
│     │  ├─ ProgressTracker/
│     │  │  ├─ index.tsx      # 出口文件
│     │  │  └─ StepItem.tsx
│     │  └─ AnalysisReport.tsx
│     ├─ hooks/
│     │  └─ useStockAnalysis.ts   # 处理状态机与 API 调用
│     ├─ types.ts                 # 本业务域的类型定义
│     ├─ index.tsx                # 业务聚合导出
│     └─ __tests__/               # 单元测试
└─ app/
   └─ stock-analysis/page.tsx     # 精简后的路由页面
```

## 4. 组件拆分明细

| 拆分单元 | 目标文件 | 说明 |
| --- | --- | --- |
| StockInputForm | `features/stock-analysis/components/StockInputForm.tsx` | 输入股票代码表单，内部仍可复用 `CInput` & `CButton` |
| ProgressTracker | `features/stock-analysis/components/ProgressTracker/index.tsx` | 包含整体进度 & 步骤列表 |
| └─ StepItem | `features/stock-analysis/components/ProgressTracker/StepItem.tsx` | 进度条内单个步骤项 |
| AnalysisReport | `features/stock-analysis/components/AnalysisReport.tsx` | 分析完成后的报告卡片 |
| useStockAnalysis | `features/stock-analysis/hooks/useStockAnalysis.ts` | 管理 idle / processing / complete 状态、进度模拟、API 调用 |
| 类型定义 | `features/stock-analysis/types.ts` | `AnalysisStatus`、`Step`, `AnalysisReport` 等类型 |
| 页面 | `app/stock-analysis/page.tsx` | 仅管理路由与渲染 `StockAnalysis` 业务组件 |

## 5. 页面简化思路

`page.tsx` 将只保留：
1. 路由元数据（如 `export const metadata = ...`）。
2. `export default function StockAnalysisPage()`，内部只负责：
   - `const { status, progress, steps, stockCode, startAnalysis, reset } = useStockAnalysis();`
   - 根据 `status` 渲染对应组件（`StockInputForm` / `ProgressTracker` / `AnalysisReport`）。

## 6. 任务拆分

- [ ] 在 `src/features/stock-analysis` 下创建目录结构
- [ ] 将 **StockInputForm** 迁移为独立组件
- [ ] 将 **ProgressTracker** & **StepItem** 迁移为独立组件
- [ ] 将 **AnalysisReport** 迁移为独立组件
- [ ] 创建 **types.ts** 并补充类型定义（无 `any`）
- [ ] 实现 **useStockAnalysis hook**，封装状态机与模拟/真实 API 逻辑
- [ ] 精简 `app/stock-analysis/page.tsx`，采用 hook + 组件组合方式
- [ ] 为每个组件编写 Storybook / Jest 单元测试
- [ ] 更新文档 & README

## 7. 风险与注意事项

1. **路径别名**：确保 `tsconfig.json` 中配置 `@/features/*` 别名。
2. **全局状态管理**：若后续需要跨页面共享数据，可考虑引入 Zustand/Jotai 等轻量状态库。
3. **接口接口化**：拆分后应将 API 地址与模型配置抽离为常量或 `.env` 变量，便于环境切换。

---

> 以上为 `page.tsx` 重构与组件拆分的整体规划。后续可按任务列表逐步实施。
