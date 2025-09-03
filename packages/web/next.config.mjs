/** @type {import('next').NextConfig} */
const nextConfig = {
  // 强制 Next.js 编译工作空间中的包，解决 ESM 模块导入问题
  transpilePackages: ['datasources'],
};

export default nextConfig;
