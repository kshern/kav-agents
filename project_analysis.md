# 项目分析报告: kav

## 1. 项目概述

`kav` 是一个基于 TypeScript 和 React 的金融科技项目，采用 pnpm monorepo 架构进行管理。该项目旨在利用人工智能（AI）代理对金融市场和股票进行分析，并为用户提供直观的分析结果。

## 2. 技术栈

- **包管理器**: pnpm
- **前端框架**: React, Next.js, Vite
- **UI 库**: Tailwind CSS, Radix UI
- **核心逻辑**: TypeScript, Node.js
- **AI 与数据处理**:
  - `ai`、`@ai-sdk/google`、`@ai-sdk/openai`: 用于构建和驱动 AI 分析（AI SDK 方案，已替代早期的 LangChain 方案）。
  - `yahoo-finance2`: 用于获取股票市场数据。
  - `axios` & `cheerio`: 用于网络请求和数据抓取。

## 3. 项目结构

项目采用 monorepo 结构，代码库分为以下几个核心包：

### `packages/core`

这是项目的核心引擎，包含了所有与 AI 分析和数据处理相关的逻辑。它被其他前端包作为依赖项使用。

- **主要功能**: 提供 `analyzeFundamentals`（基本面分析）、`analyzeMarket`（市场分析）、`analyzeNews`（新闻分析）等核心服务。
- **关键技术**: 利用 AI SDK（`ai`、`@ai-sdk/google`、`@ai-sdk/openai`）进行 AI 分析，并通过 `yahoo-finance2` 获取实时金融数据。

### `packages/web`

这是项目的主要 Web 应用，使用 Next.js 构建，是用户与平台交互的主要入口。

- **主要功能**: 提供项目的着陆页和主导航。用户通过此应用可以访问到核心的股票分析功能。
- **技术特点**: 使用 Next.js App Router 进行路由管理，并采用 Tailwind CSS 构建现代化、响应式的用户界面。

### `packages/trade`

这是一个基于 Vite 和 React 的前端应用，可能用于内部测试或作为特定的分析工具。

- **主要功能**: 提供一个简单的界面，可以直接调用 `core` 包中的分析函数，并展示分析报告。
- **技术特点**: 直接与 `core` 包集成，用于快速验证和展示核心分析功能的输出。

### `packages/chzj`

这是一个基础的 Vite + React 应用，目前功能尚未实现，可能是一个预留的开发模板或未来的功能模块。

## 4. 总结

`kav` 项目架构清晰，职责分离。`core` 包作为强大的 AI 分析后端，`web` 包作为优雅的用户前端，`trade` 包则作为灵活的测试和调试工具。这种模块化的设计使得项目易于维护和扩展。

项目的核心竞争力在于其 AI 代理的分析能力，通过结合大语言模型和实时金融数据，为用户提供深入的投资洞察。
