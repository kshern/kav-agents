# 项目代码审计与优化建议（初稿）

生成时间：2025-08-09 02:32 (+08:00)
适用范围：`packages/web`、`packages/core`

---

## 结论摘要

- __重复组件与样式链路风险__：`core` 中存在两套 Button 实现且 `web` 未使用 `core` 的 Button；SCSS 引入但未完善打包链路。
- __未使用依赖__：`core` 中若干依赖未检出使用，建议清理以减小体积与风险。
- __ESLint 配置重复__：`web` 同时存在 Flat Config 与旧式配置，存在重复/冲突潜在风险。
- __包导出结构不完善__：`core` 缺少 `exports` 子路径映射，不利于未来包分发与边界控制。
- __TS/构建细节可优化__：`web` 别名/`baseUrl` 可简化，`core` 的 `esModuleInterop` 建议统一为 `true`。
- __网关默认分支不透明__：未知 provider 静默回退到 OpenRouter，容易掩盖配置问题。
- __SSE 健壮性可加强__：建议透传取消信号、心跳保活与清理流程。

---

## 详细问题与建议（按主题）

### 1) 重复/冗余 Button 组件
- 位置：
  - `packages/core/src/components/Button/index.tsx`（含 `./Button.scss`）
  - `packages/core/src/Button.tsx`（简单实现）
- 现状：`packages/web` 实际使用 `@/components/ui/button`，未消费 `core` 的 Button。
- 风险：
  - 组件来源混淆、API 分歧；
  - `SCSS` 依赖与打包策略缺失导致构建/样式问题。
- 建议：
  - 若 `core` 定位为“无 UI 的逻辑/Agent/types 包”：删除 `core/src/components/` 与 `core/src/Button.tsx`，并从 `core/src/index.ts` 移除导出。
  - 若确需 UI：仅保留单一实现，引入 `sass` 依赖并完善样式打包；配置 `package.json#sideEffects` 确保样式不被 tree-shaking 移除。

### 2) `core` 未使用依赖
- 位置：`packages/core/package.json`
- 未检出使用：`axios`、`cheerio`、`@ai-sdk/openai`、`exponential-backoff`
- 建议：移除上述未使用依赖，减少装包与构建时间、降低攻击面。

### 3) `web` ESLint 配置重复
- 位置：
  - `packages/web/.eslintrc.json`
  - `packages/web/eslint.config.mjs`
- 问题：Flat Config 与旧式配置并存，规则可能重复/冲突。
- 备注：`.eslintrc.json` 中 `no-restricted-imports` 正在限制客户端导入 `@core/server`（值得保留）。
- 建议：删除 `.eslintrc.json`，将限制规则迁移到 `eslint.config.mjs`，统一使用 Flat Config。

### 4) `core` 包导出结构（exports）
- 现状：依赖 TS paths 与 `transpilePackages: ["core"]` 运行；若未来发布/分发，会缺少子路径导出。
- 建议：在 `packages/core/package.json` 增加：
  - `exports`: 至少提供 `".": "./dist/index.js"` 与 `"./server": "./dist/server.js"`（理想情况下同时映射 `types`）。
  - `files`: `["dist"]`，确保发布内容可控。
- 要求：`vite` 产出 `index`/`server` 对应入口；`tsc` 输出 `.d.ts` 已开启。

### 5) 样式/SCSS 打包链路
- 位置：`packages/core/src/components/Button/index.tsx` 引入 `./Button.scss`
- 问题：未见 `sass` 依赖与样式处理配置，未来消费该组件可能导致构建失败或样式缺失。
- 建议：
  - 若保留 UI：添加 `sass` 依赖，明确样式打包策略（例如将样式交给消费端或在 `core` 构建中打包/导出）。
  - 若移除 UI：本项可忽略。

### 6) TypeScript 配置细节
- `packages/web/tsconfig.json`：`baseUrl: "../../"` 增加跨包耦合。
  - 建议：设为 `"."`，并将 `@/*` 映射到 `"./src/*"`。
- `packages/core/tsconfig.json`：`esModuleInterop: false` 与常见 ESM 生态不一致。
  - 建议：设为 `true`（配合 `allowSyntheticDefaultImports`，减少默认导入踩坑）。

### 7) 模型网关默认分支行为
- 位置：`packages/core/src/models/gateway.ts`
- 现状：`switch(modelConfig.provider)` 的 `default` 分支静默回退 `openrouter`。
- 风险：配置错误（provider 拼写/遗漏）被掩盖。
- 建议：`default` 分支抛出可读错误（指明未知 provider 并给出可选值），在 README/注释说明各 provider 所需 `api_key`/`base_url`。

### 8) SSE 路由健壮性
- 位置：`packages/web/src/app/api/analysis/stream/route.ts`
- 建议：
  - 透传 `request.signal` 给执行器/Agent，客户端断开时进行取消；
  - 定期发送心跳帧（如 `:heartbeat\n\n`）保持连接；
  - 在关闭前确保 flush 与资源清理。

### 9) 执行器扩展性（可选增强）
- 位置：`packages/core/src/pipeline/executor.ts`
- 建议：
  - 支持 `AbortSignal` 取消/超时；
  - 失败重试（幂等步骤）与并行分组/DAG 依赖；
  - 更细粒度的进度/日志事件。

### 10) peerDependencies（仅当保留 UI）
- 位置：`packages/core/package.json`
- 建议：若保留 UI 组件，补充 `react-dom` 为 `peerDependencies`；否则移除 UI 相关 peer，仅保留纯逻辑导出。

---

## 优先级行动清单（待你确认后执行）

- [ ] 高：删除/收敛 `core` Button，移除 `core/src/components/` 与 `core/src/Button.tsx`，并更新导出。
- [ ] 高：清理 `core` 未使用依赖：`axios`、`cheerio`、`@ai-sdk/openai`、`exponential-backoff`。
- [ ] 高：统一 `web` ESLint 到 Flat Config，将 `no-restricted-imports` 迁移后删除 `.eslintrc.json`。
- [ ] 高：在 `core/package.json` 增加 `exports` 与 `files`，验证 `vite build`/`tsc` 产物。
- [ ] 中：`web/tsconfig.json` 将 `baseUrl` 设为 `"."`，`@/* -> ./src/*`。
- [ ] 中：`core/tsconfig.json` `esModuleInterop: true`。
- [ ] 中：`gateway.ts` 默认分支改为显式报错。
- [ ] 中：SSE 路由透传取消、心跳与清理。
- [ ] 低：执行器支持 `AbortSignal`/超时/重试/并行分组。
- [ ] 低：若保留 UI，补充 `react-dom` 为 peer 并完善样式策略。

---

## 正面项（保持）

- `web/next.config.ts` 使用 `transpilePackages: ["core"]`。
- `web` 在 API Route 中导入 `@core/server`，在 Hook 中仅使用 `@core` 的类型导出，边界清晰。
- `core` 的 `vite` 多入口（`index`/`server`）与类型产出配置合理。

---

## 备注

- 本文档为“活文档”，后续可直接勾选行动项并追加细节。
- 如需要，我可基于此清单拆分为若干最小变更 PR，逐步合入，确保稳定性。
