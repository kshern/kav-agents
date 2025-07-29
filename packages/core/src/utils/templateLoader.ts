/**
 * @file 模板加载工具
 * @description 提供跨环境的模板文件加载功能，兼容 Node.js 和浏览器环境
 */

// 模板缓存，避免重复加载
const templateCache = new Map<string, string>();

/**
 * 在 Node.js 环境下加载模板文件
 * @param templatePath - 相对于当前文件的模板路径
 * @param currentFileUrl - 当前文件的 import.meta.url
 * @returns 模板内容字符串
 */
async function loadTemplateInNodejs(templatePath: string, currentFileUrl: string): Promise<string> {
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  // 获取当前文件的路径
  const __filename = fileURLToPath(currentFileUrl);
  // 获取当前文件所在的目录  
  const __dirname = path.dirname(__filename);
  
  // 从正确解析的目录加载模板文件
  return fs.readFileSync(
    path.join(__dirname, templatePath),
    "utf-8"
  );
}

/**
 * 检测当前是否在 Node.js 环境中
 * @returns 是否在 Node.js 环境
 */
function isNodejsEnvironment(): boolean {
  return typeof process !== 'undefined' && 
         process.versions !== undefined && 
         process.versions.node !== undefined;
}

/**
 * 加载模板文件 - 兼容 Node.js 和浏览器环境
 * 
 * 使用方式：
 * - Node.js 环境：会自动使用 fs.readFileSync 读取文件
 * - Vite 环境：需要手动传入通过 import xxx?raw 导入的模板内容
 * 
 * @param templatePath - 模板文件路径（相对于调用文件）
 * @param currentFileUrl - 当前文件的 import.meta.url
 * @param viteTemplate - 在 Vite 环境下通过 import 'xxx?raw' 获取的模板内容
 * @returns 模板内容字符串
 */
export async function loadTemplate(
  templatePath: string,
  currentFileUrl: string,
  viteTemplate?: string
): Promise<string> {
  const cacheKey = `${currentFileUrl}:${templatePath}`;
  
  // 检查缓存
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  let template: string;

  if (isNodejsEnvironment()) {
    // Node.js 环境 (Next.js server, Node.js scripts)
    template = await loadTemplateInNodejs(templatePath, currentFileUrl);
  } else {
    // 浏览器/Vite 环境
    if (!viteTemplate) {
      throw new Error(
        `在浏览器环境中，必须提供 viteTemplate 参数。` +
        `请在调用此函数时传入通过 'import xxx from "./path?raw"' 获取的模板内容。`
      );
    }
    template = viteTemplate;
  }

  // 缓存模板
  templateCache.set(cacheKey, template);
  return template;
}

/**
 * 清空模板缓存（主要用于测试）
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}
