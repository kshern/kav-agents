# 项目代码库说明（中文）

更新时间：2025-08-05 11:23:32 (UTC+08)

## 一、总体概览

本仓库采用 pnpm monorepo 架构，包含四个包：
- `packages/core`：核心 TypeScript 库，封装 AI 驱动的金融/股票分析逻辑与工具。
- `packages/web`：主站 Web 应用（Next.js 15 + React 19 + Tailwind + Radix UI）。
- `packages/trade`：Vite + React 演示/沙盒应用，依赖 `core` 用于快速验证。
- `packages/chzj`：与 `trade` 类似的 Vite + React 应用，可能作为模板或第二个 demo。

根目录关键文件：
- `package.json`：根脚本目前仅构建 `packages/chzj`。
- `pnpm-workspace.yaml`：包含 `packages/*` 下所有包。
- `project_analysis.md`：现有的中文项目分析报告。

## 二、技术栈与依赖

- 包管理：pnpm monorepo
- 语言与框架：TypeScript、React 19、Next.js 15、Vite 7
- UI：Tailwind CSS、Radix UI、Lucide 图标
- AI/数据：ai、@ai-sdk/google、@ai-sdk/openai、yahoo-finance2、axios、cheerio、mustache、gray-matter、exponential-backoff

## 三、各包详解

### 1) packages/core（核心库）
- 目标：对外提供 AI 财经分析能力与通用工具；同时包含少量客户端可用的 UI/类型导出。
- 构建：`vite build && tsc`，产物至 `dist/`，同时生成类型定义。
- 模块类型：ESM（`"type": "module"`）。
- 依赖亮点：
  - `ai` 与 `@ai-sdk/google`/`@ai-sdk/openai`：驱动 LLM 分析（需要服务端环境配置 API Key）。
  - `yahoo-finance2`：行情与基本面数据。
  - `axios` + `cheerio`：网络请求与爬取。
  - `mustache`、`gray-matter`：模板与内容元数据处理。

- 目录要点：
  - `src/index.ts`：客户端安全导出（如 `components/Button` 与公共类型）。
  - `src/server.ts`：服务端专用导出（包含依赖 Node 能力的分析函数）。
  - `src/agents/`：函数式 Agent 集合，统一从 `src/agents/index.ts` 导出：
    - 分析师：`analyzeFundamentals`、`analyzeMarket`、`analyzeNews`、`analyzeSocialMedia`
    - 管理者：`manageResearch`、`manageRisk`
    - 研究员：`researchBull`、`researchBear`
    - 风险辩手：`debateAggressive`、`debateConservative`、`debateNeutral`
    - 交易员：`createTradePlan`
  - 其他：`models/`、`types/`、`utils/`、`dataflows/`、`memory/` 等配套模块。

- 使用建议：
  - 客户端（浏览器）：仅从 `core` 的客户端安全入口（`src/index.ts` 对应的包导出）引入。
  - 服务端（Node/Next.js Server/Route Handler）：从 `core/src/server` 暴露的入口或包级 server 导出使用重型分析函数。

### 2) packages/web（Next.js 应用）
- 目标：主站 UI，承载主要用户交互。
- 栈：Next.js 15（App Router）、React 19、Tailwind、Radix UI。
- 脚本：`dev`（turbopack）、`build`、`start`、`lint`。
- 文档/规划：`README.md`、`STOCK_ANALYSIS.md`、`page_refactor_plan.md`、`mock_components_migration_plan.md`。
- 集成方式：服务端调用 `core` 的分析能力；客户端仅使用安全导出（如 UI 组件与类型）。

### 3) packages/trade（Vite + React 演示）
- 目标：轻量 demo/沙盒，快速验证 `core` 的分析输出与 UI 展示。
- 依赖：`core`（workspace:^）、React 19。
- 脚本：`dev`、`build`、`preview`、`lint`。

### 4) packages/chzj（Vite + React）
- 目标：与 `trade` 类似，可能作为模板或第二个 demo。
- 依赖与脚本基本同 `trade`。

## 四、典型数据流
1. UI（`web` 或 `trade`/`chzj`）触发分析请求。
2. 服务端（Next.js Route Handler/Server Actions 或 Node）调用 `core` 的服务端分析函数：
   - 调用 LLM（AI SDK：`ai` + `@ai-sdk/google`/`@ai-sdk/openai`）。
   - 获取市场/基本面数据（`yahoo-finance2`）。
   - 必要时进行网页抓取（`axios` + `cheerio`）。
3. 将分析结果返回给前端进行展示。客户端严格避免引入服务端专用模块。

## 五、运行与构建
- 安装依赖（仓库根目录）：
  ```bash
  pnpm install
  ```
- 运行主站（web）：
  ```bash
  pnpm -C packages/web dev
  ```
- 运行演示（trade）：
  ```bash
  pnpm -C packages/trade dev
  ```
- 运行演示（chzj）：
  ```bash
  pnpm -C packages/chzj dev
  ```
- 构建核心库：
  ```bash
  pnpm -C packages/core build
  ```
- 注意：根 `package.json` 的 `build` 目前仅构建 `packages/chzj`。

## 六、环境与密钥
- 使用 AI SDK 时需要在服务端环境配置相应提供商的 API Key（如 Google 或 OpenAI），通过环境变量注入。
- 确保密钥不会被打入客户端 Bundle：把所有调用 LLM 的逻辑放到服务端（`core/src/server.ts` 或 Next.js Server 端）。

## 七、后续建议
- 补充根脚本：增加“一键构建/测试/代码检查”以覆盖所有包。
- 在 `web` 中统一封装对 `core` 的服务端调用（如 `app/api/*` 或 Server Actions）。
- 为 `agents` 中关键函数补充输入/输出类型文档与示例，便于二次开发与测试。
