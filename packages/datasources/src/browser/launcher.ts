// 浏览器启动封装（Puppeteer）——集中管理浏览器可执行路径、渠道与回退逻辑
// 目标：让业务代码与具体浏览器实现解耦，未来可无痛替换为 Playwright 等。

import puppeteer, { Browser } from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

// 允许的 Chrome 渠道（Puppeteer 类型层面仅支持 Chrome 渠道）
type ChromeChannel = 'chrome' | 'chrome-beta' | 'chrome-dev' | 'chrome-canary';
const AllowedChromeChannels = new Set<ChromeChannel>(config.browser.allowedChannels);

function toChromeChannel(s: string | undefined): ChromeChannel | undefined {
  if (!s) return undefined;
  const v = s as ChromeChannel;
  return AllowedChromeChannels.has(v) ? v : undefined;
}

// 从环境变量中读取显式可执行文件路径（优先级最高）
function getExecFromEnv(): string | undefined {
  for (const key of config.browser.execEnvKeys) {
    const v = process.env[key];
    if (v && v.trim().length > 0) return v;
  }
  return undefined;
}

// 在 Windows 上探测 Edge 可执行文件路径（用于回退）
function getEdgeExecutablePathWin(): string | undefined {
  const candidates = [
    'C\\\\Program Files\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // ignore
    }
  }
  // 额外：尝试通过 %PROGRAMFILES% 推断路径（避免 C 盘硬编码）
  const programFiles = process.env['PROGRAMFILES'];
  if (programFiles) {
    const guess = path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe');
    try {
      if (fs.existsSync(guess)) return guess;
    } catch {
      // ignore
    }
  }
  const programFilesX86 = process.env['PROGRAMFILES(X86)'];
  if (programFilesX86) {
    const guess = path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe');
    try {
      if (fs.existsSync(guess)) return guess;
    } catch {
      // ignore
    }
  }
  return undefined;
}

// 统一的浏览器启动函数
export async function launchBrowser(options?: { headless?: boolean; args?: string[] }): Promise<Browser> {
  // 默认值收口到 config.browser
  const baseArgs = options?.args ?? config.browser.argsDefault;
  const headless = options?.headless ?? config.browser.headlessDefault;

  // 记录每次尝试的错误，便于给出清晰提示
  const errors: string[] = [];

  // 尝试 1：显式可执行路径
  const envExec = getExecFromEnv();
  if (envExec) {
    try {
      return await puppeteer.launch({ headless, args: baseArgs, executablePath: envExec });
    } catch (e) {
      errors.push(`executablePath=${envExec} 启动失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 尝试 2：Chrome 渠道（需本机已安装对应渠道）
  const channel: ChromeChannel = toChromeChannel(process.env.PUPPETEER_CHANNEL) ?? config.browser.channelDefault;
  try {
    return await puppeteer.launch({ headless, args: baseArgs, channel });
  } catch (e) {
    errors.push(`channel=${channel} 启动失败: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 尝试 3（Windows 回退）：使用 Edge 可执行文件
  if (process.platform === 'win32') {
    const edgePath = getEdgeExecutablePathWin();
    if (edgePath) {
      try {
        return await puppeteer.launch({ headless, args: baseArgs, executablePath: edgePath });
      } catch (e) {
        errors.push(`Edge executablePath=${edgePath} 启动失败: ${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      errors.push('未找到 Edge 可执行文件路径用于回退');
    }
  }

  // 全部失败，汇总报错并提供指引
  const guide = [
    '解决方案:',
    '1) 安装内置浏览器: pnpm dlx puppeteer browsers install chrome',
    '2) 或设置 PUPPETEER_EXECUTABLE_PATH 指向本机 Chrome/Edge 可执行文件',
    '3) 也可设置 PUPPETEER_CHANNEL=chrome/chrome-beta/chrome-dev/chrome-canary（需本机已安装对应渠道）'
  ].join('\n');
  throw new Error(`Puppeteer 启动失败\n尝试记录:\n- ${errors.join('\n- ')}\n\n${guide}`);
}

// 辅助方法：自动负责关闭浏览器
export async function withBrowser<T>(fn: (browser: Browser) => Promise<T>): Promise<T> {
  const browser = await launchBrowser();
  try {
    return await fn(browser);
  } finally {
    try {
      await browser.close();
    } catch {
      // ignore
    }
  }
}
