# packages/core/src/utils/templateLoader.ts

## 概述

- 文件职责：跨环境模板加载工具。在 Node.js 使用 fs 读取文件；在浏览器/Vite 环境接收 `?raw` 导入的模板字符串。内置缓存避免重复加载。
- 上下文/模块：位于 `utils/`，被各分析能力加载 `templates/*.md` 使用。

## 位置与命名

- 相对路径：`packages/core/src/utils/templateLoader.ts`
- 同名文档：同目录下同名 .md

## 导出清单

### function loadTemplate

- 形态: function (async)
- 签名: `(templatePath: string, currentFileUrl: string, viteTemplate?: string) => Promise<string>`
- 行为:
  - 缓存键：`currentFileUrl + ":" + templatePath`，命中则直接返回。
  - Node.js 环境：动态引入 `fs/path/url`，以 `currentFileUrl` 解析调用方目录，`fs.readFileSync(join(__dirname, templatePath))` 读取模板。
  - 浏览器/Vite 环境：必须提供 `viteTemplate`（通过 `import xxx?raw` 获取），否则抛出错误。

### function clearTemplateCache

- 形态: function
- 签名: `() => void`
- 行为: 清空内部缓存（主要用于测试或热更场景）。

## 主要依赖

- 外部依赖(0)：无第三方包（Node 内置模块：`fs`、`path`、`url` 动态引入；浏览器侧依赖 Vite `?raw` 机制传入字符串）
- 本地依赖(0)：无

## 输入 / 输出

- 输入
  - `templatePath: string`（相对调用文件的路径）
  - `currentFileUrl: string`（通常为调用文件的 `import.meta.url`）
  - `viteTemplate?: string`（仅浏览器/Vite 环境需要，来自 `import "./path?raw"`）
- 输出
  - `Promise<string>`：模板内容
- 侧效应
  - 进程内缓存模板内容；`clearTemplateCache()` 可清空缓存。

## 使用示例

```ts
import { loadTemplate, clearTemplateCache } from "./templateLoader";

// Node.js / Next.js Server 场景
const tpl1 = await loadTemplate("../templates/fundamentals.md", import.meta.url);

// Vite/浏览器 场景
import fundamentalsTpl from "../templates/fundamentals.md?raw";
const tpl2 = await loadTemplate("../templates/fundamentals.md", import.meta.url, fundamentalsTpl);

// 测试/热更：清空缓存
clearTemplateCache();
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.520Z
- 人工更新：2025-08-17T01:11:14+08:00
