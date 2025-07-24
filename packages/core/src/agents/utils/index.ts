/**
 * @description 填充 prompt 模板中的占位符。
 * @param template 包含 {{key}} 占位符的模板字符串。
 * @param data 一个键值对对象，其中键对应于模板中的占位符名称。
 * @returns {string} 填充了数据的模板字符串。
 */
export const fillPromptTemplate = <T extends Record<string, string>>(
  template: string,
  data: T
): string => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    return acc.replace(regex, value);
  }, template);
};
