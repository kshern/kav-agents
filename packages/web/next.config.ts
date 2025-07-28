import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['core'], // 添加core包到转译包列表，确保能正确解析导入
};

export default nextConfig;
