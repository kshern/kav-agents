# kav-agents Monorepo

一个基于 TypeScript/React 的多包（pnpm monorepo）项目，用于驱动 AI 股票/金融分析与演示站点。

- 包管理：pnpm
- 语言与框架：TypeScript、React 19、Next.js 15、Vite 7
- UI：Tailwind CSS、Radix UI
- AI/数据：AI SDK（ai、@ai-sdk/google、openai 客户端）、yahoo-finance2、mustache、gray-matter


## 目录结构

- `packages/core`：核心库（ESM）。封装模型网关、分析能力、类型与工具。
- `packages/web`：主站（Next.js App Router）。整合登录、发起分析、SSE 流展示。
- `packages/trade`：Vite + React 的演示/沙盒。
- `packages/chzj`：另一个 Vite + React 演示/模板。

更多说明见：
- `codebase_overview_zh.md`
- `project_analysis.md`
- `CODE_AUDIT.md`


## 快速开始

1) 安装依赖（要求 Node ≥ 20、pnpm ≥ 9）

```bash
pnpm install
```

2) 运行主站（Next.js）

```bash
pnpm -C packages/web dev
# 访问 http://localhost:3000
```

3) 运行演示（可选）

```bash
pnpm -C packages/trade dev
pnpm -C packages/chzj dev
```

4) 构建

```bash
pnpm -C packages/core build
pnpm run build:all  # 构建 core/web/trade/chzj（见根 package.json）
```

5) 代码风格

```bash
pnpm run format       # Prettier 写入
pnpm run format:check # Prettier 校验
pnpm run lint:web     # 仅 web 的 ESLint
```


## 环境变量与密钥

根据已实现代码，需配置如下变量（建议使用 `.env.local`/平台环境变量）——

- Supabase（用于鉴权与事件持久化）
  - `SUPABASE_URL`
  - `SUPABASE_KEY`

- 模型提供商（任选其一或多项）
  - OpenRouter（默认）：`OPENROUTER_API_KEY`
  - Google Gemini：`GOOGLE_GENERATIVE_AI_API_KEY`
  - GitHub Models（OpenAI 兼容端点示例）：`GITHUB_TOKEN`

说明：
- 默认模型配置见 `packages/core/src/config/models.ts`：
  - provider 默认 `openrouter`
  - 模型默认 `z-ai/glm-4.5-air:free`
  - 使用 `OPENROUTER_API_KEY`
- OpenAI 兼容客户端实现参见 `packages/core/src/models/openai.ts` 与 `packages/core/src/models/openrouter.ts`。
- Gemini 实现参见 `packages/core/src/models/gemini.ts`（AI SDK）。


## 分析流（SSE）与持久化

本项目通过 SSE 推送分析进度；可将事件持久化到云端（Supabase）以便回放。
注意：当前默认未启用写入 Supabase，如需开启，请在 `packages/web/src/app/api/analysis/stream/route.ts` 中取消对 `appendEvent(...)` 的注释。

- 创建会话：`POST /api/analysis/session`
  - 可传入 `{ symbol?: string }`
  - 返回 `{ analysisId, symbol }`
  - 会在表 `analysis_sessions` 记录 `analysisId -> symbol` 映射（RLS 保护，按用户隔离）

- 开始分析（SSE）：`GET /api/analysis/stream?analysisId=...`
  - 鉴权：要求有效 Supabase 会话
  - 事件类型：`started`、`progress`、`final`、`error`、`aborted`
  - 心跳：每 25s 发送 `:heartbeat`，支持取消（AbortSignal）

- 读取缓存：`GET /api/analysis/cache?analysisId=...`
  - 从 Supabase 表 `analysis_events` 读取“完成态/错误态”事件，按时间升序返回

- 代码位置：
  - 路由：`packages/web/src/app/api/analysis/*`
  - 会话存取：`packages/web/src/server/analysisSession.ts`
  - 事件存取：`packages/web/src/server/analysisStore.ts`

- Supabase 表示例（请根据业务需要在 SQL 控制台创建并开启 RLS）

```sql
-- 会话表：analysisId -> symbol（与用户绑定）
create table if not exists public.analysis_sessions (
  analysis_id text primary key,
  symbol text not null,
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.analysis_sessions enable row level security;
create policy "own rows insert" on public.analysis_sessions for insert with check (auth.uid() = user_id);
create policy "own rows select" on public.analysis_sessions for select using (auth.uid() = user_id);
create policy "own rows update" on public.analysis_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 事件表：仅持久化完成/错误等关键输出（字段与 analysisStore.ts 保持一致）
create table if not exists public.analysis_events (
  id bigserial primary key,
  analysis_id text not null,
  ts timestamptz not null default now(),
  event_type text not null,          -- 'final' | 'progress' | 'error'
  status text not null,              -- 'completed' | 'error'
  step_id text not null,
  step_text text,
  group_key text,
  round_no int4 default 0,
  member_id text default '',
  member_order int4,
  progress int4 default 0,
  result_json jsonb,
  result_md text,
  error jsonb,
  constraint fk_analysis_id foreign key (analysis_id) references public.analysis_sessions(analysis_id) on delete cascade
);
create index if not exists idx_analysis_events_analysis_id on public.analysis_events(analysis_id, ts);
alter table public.analysis_events enable row level security;
-- 示例策略（最小化）：仅允许访问自己会话下的事件
create policy "own events select" on public.analysis_events for select using (
  exists (
    select 1 from public.analysis_sessions s
    where s.analysis_id = analysis_events.analysis_id and s.user_id = auth.uid()
  )
);
```

注：早期版本曾采用本地 JSONL 存储，现已切换为 Supabase（云端）以支持登录与多端回放。


## 模型网关与配置

- 网关：`packages/core/src/models/gateway.ts`
  - 支持 `google` | `openai` | `openrouter`
  - 未知 provider 会抛出错误，避免静默降级
- 默认模型配置：`packages/core/src/config/models.ts`
  - 通过 `getModelConfig(abilityKey)` 获取能力默认配置
  - 通过 `mergeModelConfig(base, override)` 合并运行时覆盖

建议：将重型模型调用放到服务端，仅在客户端使用 `@core` 的“客户端安全导出”；服务端使用 `@core/server`。


## 脚本（根）

见 `package.json`：

- `build`：构建 `packages/chzj`
- `build:all`：依次构建 core/web/trade/chzj
- `dev:web` / `dev:core`：分别进入子包开发
- `lint:web`、`format`、`format:check`


## 常见问题

- 404 或 401：请确认 `SUPABASE_URL`/`SUPABASE_KEY` 已配置，且已登录（Supabase 会话）。
- 模型报错：检查相应提供商的 API Key 与可用模型名（如 `z-ai/glm-4.5-air:free`）。
- 客户端导入失败：确保仅在服务端导入 `@core/server`，客户端导入 `@core`。


## 许可证

ISC（见各包 `package.json#license`）。
