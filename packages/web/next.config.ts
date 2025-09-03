import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["core", "datasources"], // 添加 core 与 datasources 包到转译列表，确保能正确解析导入
};

export default nextConfig;
