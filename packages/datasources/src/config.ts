// 统一配置：集中管理本包用到的可调项，便于未来替换实现（如改用 Playwright）
// 注意：NodeNext 模式下，TS 源文件之间的相对导入需要在使用处写 .js 扩展名；
// 因此本文件在其它源码中以 '../config.js' 导入。

// 浏览器相关配置（仅暴露静态默认值，动态选择在 src/browser/launcher.ts 内处理）
export interface BrowserConfig {
  // 默认是否无头
  headlessDefault: boolean;
  // 默认启动参数
  argsDefault: string[];
  // 可从这些环境变量读取浏览器可执行路径（优先级最高）
  execEnvKeys: readonly string[];
  // 允许的 Chrome 渠道（Puppeteer 类型仅接受这些）
  allowedChannels: readonly ['chrome', 'chrome-beta', 'chrome-dev', 'chrome-canary'];
  // 默认渠道
  channelDefault: 'chrome';
}

// 问财抓取相关配置
export interface WencaiConfig {
  // 目标 API（响应监听用）
  targetUrl: string;
  // Referer 页面（通过访问该页面触发目标 API 请求）
  refererBase: string; // 例如：https://www.iwencai.com/unifiedwap/inforesult
  // 页面加载等待策略
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  // 目标响应方法
  responseMethod: 'POST' | 'GET';
}

// 批量 CLI 默认项
export interface BatchConfig {
  // 默认输入相对路径（相对于执行目录 cwd）
  defaultInputPath: string; // e.g. data/wencai/symbols.jsonl
  // 默认输出目录相对路径
  defaultOutDir: string; // e.g. data/wencai/news
  // 每条请求默认超时
  defaultTimeoutMs: number;
  // 每条请求之间默认间隔
  defaultSleepMs: number;
}

export interface DatasourcesConfig {
  browser: BrowserConfig;
  wencai: WencaiConfig;
  batch: BatchConfig;
}

export const config: DatasourcesConfig = {
  browser: {
    headlessDefault: true,
    argsDefault: ['--no-sandbox', '--disable-setuid-sandbox'],
    execEnvKeys: ['PUPPETEER_EXECUTABLE_PATH', 'CHROME_PATH', 'KAV_CHROME_PATH'],
    allowedChannels: ['chrome', 'chrome-beta', 'chrome-dev', 'chrome-canary'],
    channelDefault: 'chrome'
  },
  wencai: {
    targetUrl: 'https://www.iwencai.com/unifiedwap/unified-wap/v1/information/news',
    refererBase: 'https://www.iwencai.com/unifiedwap/inforesult',
    waitUntil: 'networkidle2',
    responseMethod: 'POST'
  },
  batch: {
    defaultInputPath: 'data/wencai/symbols.jsonl',
    defaultOutDir: 'data/wencai/news',
    defaultTimeoutMs: 60_000,
    defaultSleepMs: 0
  }
};
