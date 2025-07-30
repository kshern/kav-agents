import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['core'], // 添加core包到转译包列表，确保能正确解析导入
  
  webpack: (config) => {
    // 添加对 .md 文件的支持，兼容 Vite 的 ?raw 语法
    config.module.rules.push({
      test: /\.md$/,
      resourceQuery: /raw/, // 匹配 ?raw 查询参数
      type: 'asset/source', // 将文件内容作为字符串导入
    });
    
    // 为没有 ?raw 的普通 .md 文件也添加支持
    config.module.rules.push({
      test: /\.md$/,
      resourceQuery: { not: [/raw/] }, // 不匹配 ?raw 的情况
      type: 'asset/source',
    });
    
    return config;
  },
};

export default nextConfig;
