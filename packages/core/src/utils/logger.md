# packages/core/src/utils/logger.ts

## 概述

- 文件职责：轻量级文件日志工具（Node 优先，浏览器环境静默降级）。提供结构化 JSON 行日志写入，适合流水线/能力模块记录过程数据。
- 上下文/模块：位于 `utils/`，被 `adapters/memory`、pipeline 等模块引用。

## 位置与命名

- 相对路径：`packages/core/src/utils/logger.ts`
- 同名文档：同目录下同名 .md

## 导出清单

### type LogLevel

- 形态: type
- 定义: `"INFO" | "ERROR" | "DEBUG"`

### interface LogEntry

- 形态: interface
- 字段:
  - `timestamp: string` ISO 时间戳
  - `level: LogLevel`
  - `scope: string` 模块/步骤范围（如 `TradeAgent`）
  - `message: string` 简短描述
  - `data?: unknown` 结构化载荷

### class FileLogger

- 形态: class
- 构造: `(filePath: string)` 指定日志文件路径（相对当前进程 CWD）。
- 方法:
  - `write(entry: LogEntry): Promise<void>` 写入一条日志
  - `info(scope: string, message: string, data?: unknown): Promise<void>`
  - `error(scope: string, message: string, data?: unknown): Promise<void>`
  - `debug(scope: string, message: string, data?: unknown): Promise<void>`
- 行为与实现要点:
  - 运行于 Node 时动态引入 `node:fs/promises`，保证打包时不强耦合 fs；创建目录（`mkdir -p`）后以追加方式写入一行 JSON。
  - 非 Node 环境或权限异常时静默降级（不抛错、不打印到控制台）。

## 主要依赖

- 外部依赖(0)：无第三方依赖（Node 内置：`node:fs/promises` 动态引入）
- 本地依赖(0)：无

## 输入 / 输出

- 输入
  - 构造参数 `filePath: string`
  - 各方法参数见上
- 输出
  - 所有方法均 `Promise<void>`
- 侧效应
  - 写入 JSON 行日志到 `filePath`；在非 Node 环境静默忽略

## 使用示例

```ts
import { FileLogger } from "./logger";

const logger = new FileLogger("logs/memory.log");
await logger.info("MemoryAdapter", "情境检索-开始", { topK: 2 });
await logger.error("TradeAgent", "执行失败", { stepId: "market" });
await logger.debug("Executor", "步骤完成", { id: "s1" });
```

## 变更记录

- 生成时间：2025-08-16T09:43:34.519Z
- 人工更新：2025-08-17T01:11:14+08:00
