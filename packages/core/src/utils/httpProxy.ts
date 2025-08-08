/**
 * 全局 HTTP(S) 代理初始化工具
 * 
 * 读取以下配置来设置代理（按优先级）：
 * 1) PROXY_URL（推荐，形如 http://127.0.0.1:7890 或 https://127.0.0.1:7890）
 * 2) HTTPS_PROXY
 * 3) HTTP_PROXY
 * 4) PROXY_HOST + PROXY_PORT（将自动拼接为 http://HOST:PORT）
 * 
 * 说明：在 Node.js 的全局 fetch（基于 undici）中，默认不会自动读取上述环境变量。
 * 因此需要通过 undici 的 ProxyAgent + setGlobalDispatcher 手动设置一次全局代理。
 */

import { type Dispatcher, ProxyAgent, setGlobalDispatcher } from "undici";

let initialized = false; // 确保只初始化一次

/**
 * 确保全局代理初始化（幂等）
 * 
 * 如果检测到代理配置，则为整个进程设置全局代理。
 * 如果未检测到代理配置，则跳过且不影响正常请求。
 */
export function ensureProxyInitialized(): void {
  if (initialized) return;

  // 从环境变量读取代理配置
  const host = process.env.PROXY_HOST;
  const port = process.env.PROXY_PORT;
  const composed = host && port ? `http://${host}:${port}` : undefined;

  const proxyUrl =
    process.env.PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    composed;

  if (proxyUrl) {
    // 使用 undici 的 ProxyAgent 作为全局调度器
    const agent: Dispatcher = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(agent);
  }

  initialized = true;
}
