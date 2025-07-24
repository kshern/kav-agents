// 告诉 TypeScript 如何处理 .md?raw 导入
declare module '*.md?raw' {
  const content: string;
  export default content;
}

declare module '*.md' {
  const content: string;
  export default content;
}
