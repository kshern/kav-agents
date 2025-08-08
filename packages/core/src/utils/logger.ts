// 轻量文件日志工具（Node 优先，浏览器环境静默降级）
// Typescript 不使用 any，数据载荷用 unknown 承载

export type LogLevel = "INFO" | "ERROR" | "DEBUG";

export interface LogEntry {
  timestamp: string; // ISO 时间戳
  level: LogLevel;
  scope: string; // 模块/步骤范围，如 TradeAgent
  message: string; // 简短说明
  data?: unknown; // 结构化数据载荷
}

export class FileLogger {
  private readonly filePath: string;

  constructor(filePath: string) {
    // 使用 POSIX 风格的路径分隔符以获得跨平台兼容，Node 在 Windows 上也能识别 '/'
    this.filePath = filePath;
  }

  // 写入一行 JSON 日志
  private async appendLine(line: string): Promise<void> {
    try {
      // 动态引入，避免在浏览器打包阶段硬依赖 fs
      const fs = await import("node:fs/promises");
      const idx = this.filePath.lastIndexOf("/");
      const dir = idx > 0 ? this.filePath.slice(0, idx) : ".";
      await fs.mkdir(dir, { recursive: true });
      await fs.appendFile(this.filePath, line + "\n", { encoding: "utf8" });
    } catch {
      // 非 Node 环境或权限问题时静默降级（不向控制台打印，避免噪音）
    }
  }

  private toLine(entry: LogEntry): string {
    // 避免循环引用错误的安全序列化
    const seen = new WeakSet<object>();
    const replacer = (_key: string, value: unknown): unknown => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value as object)) return "[Circular]";
        seen.add(value as object);
      }
      // BigInt 序列化处理
      if (typeof value === "bigint") return value.toString();
      return value;
    };
    return JSON.stringify(entry, replacer);
  }

  public async write(entry: LogEntry): Promise<void> {
    await this.appendLine(this.toLine(entry));
  }

  public async info(scope: string, message: string, data?: unknown): Promise<void> {
    await this.write({
      timestamp: new Date().toISOString(),
      level: "INFO",
      scope,
      message,
      data,
    });
  }

  public async error(scope: string, message: string, data?: unknown): Promise<void> {
    await this.write({
      timestamp: new Date().toISOString(),
      level: "ERROR",
      scope,
      message,
      data,
    });
  }

  public async debug(scope: string, message: string, data?: unknown): Promise<void> {
    await this.write({
      timestamp: new Date().toISOString(),
      level: "DEBUG",
      scope,
      message,
      data,
    });
  }
}
