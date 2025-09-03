import type { Browser, Page, HTTPRequest, HTTPResponse } from 'puppeteer';
import { launchBrowser } from '../browser/launcher.js';
import { config } from '../config.js';

// 目标 API 的 URL与页面配置收口到 config

// 基于股票代码构造 Referer 页面 URL（访问该页面会触发目标 API 请求）
function buildRefererUrl(symbol: string): string {
  // 问财示例：w=300233&querytype=news
  const q = encodeURIComponent(symbol);
  return `${config.wencai.refererBase}?w=${q}&querytype=news`;
}

// 定义返回数据的类型（保持宽松，避免 any）
export type WencaiNewsResponse = unknown;

/**
 * 使用 Puppeteer 抓取问财新闻数据（服务端专用）
 * - 进入 Referer 页面以触发目标 API POST 请求
 * - 监听该请求的响应并解析 JSON 返回
 * - 仅在 Node.js 运行时可用，不适用于 Edge Runtime
 */
export async function fetchWencaiNews(symbol: string, options?: { timeoutMs?: number }): Promise<WencaiNewsResponse> {
  // 参数校验：symbol 必须存在
  if (!symbol || typeof symbol !== 'string') {
    throw new Error('symbol 不能为空');
  }

  const timeoutMs = options?.timeoutMs ?? 60_000; // 默认 60s 超时
  let browser: Browser | null = null;

  try {
    // 通过封装的 launcher 统一启动浏览器，内部已处理渠道/路径/Edge 回退等逻辑
    browser = await launchBrowser({ headless: true, args: config.browser.argsDefault });

    const page: Page = await browser.newPage();

    // 开启请求拦截（此处不修改请求，仅为可扩展预留）
    await page.setRequestInterception(true);
    page.on('request', (req: HTTPRequest) => {
      req.continue();
    });

    // 创建一个 Promise，在捕获到目标响应时 resolve（避免在构造器中引用自身 Promise 导致 TDZ 错误）
    let timer: NodeJS.Timeout;
    const dataPromise: Promise<WencaiNewsResponse> = new Promise((resolve, reject) => {
      let resolved = false;

      // 监听响应事件，筛选目标 API
      const onResponse = async (response: HTTPResponse) => {
        try {
          if (
            response.url() === config.wencai.targetUrl &&
            response.request().method() === config.wencai.responseMethod &&
            !resolved
          ) {
            const json = (await response.json()) as WencaiNewsResponse;
            resolved = true;
            page.off('response', onResponse);
            clearTimeout(timer);
            resolve(json);
          }
        } catch {
          // 捕获解析失败，但不立即 reject，等待其他响应或最终超时
        }
      };

      page.on('response', onResponse);

      // 超时保护
      timer = setTimeout(() => {
        if (!resolved) {
          page.off('response', onResponse);
          reject(new Error('抓取超时，未捕获到目标响应'));
        }
      }, timeoutMs);
    });

    // 导航到 Referer 页面以触发请求
    const referer = buildRefererUrl(symbol);
    await page.goto(referer, { waitUntil: config.wencai.waitUntil, timeout: timeoutMs });

    // 等待数据
    const data = await dataPromise;
    return data;
  } finally {
    // 确保关闭浏览器实例，避免资源泄漏
    if (browser) {
      try {
        await browser.close();
      } catch {
        // 忽略关闭异常
      }
    }
  }
}
