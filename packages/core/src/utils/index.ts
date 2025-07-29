import matter from "gray-matter";
import Mustache from "mustache";

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

/**
 * @description 解析模板并使用提供的变量渲染最终的prompt
 * @param template 包含YAML前置元数据和Mustache模板的字符串
 * @param variables 用于覆盖模板默认变量的对象
 * @param debug 是否输出调试信息，默认为false
 * @returns {string} 渲染后的最终prompt
 */
export const parseAndRenderTemplate = <T extends Record<string, unknown>>(
  template: string,
  variables: T,
  debug: boolean = false
): string => {
  try {
    // 使用 gray-matter 解析模板内容
    // 它会返回一个包含 `data` (YAML 内容) 和 `content` (Markdown 主体) 的对象
    const { data, content: markdownTemplate } = matter(template);

    // 准备用于渲染的视图 (View) 对象
    // 这里的关键是合并变量：用传入的变量覆盖掉模板文件中的默认值
    const view = {
      ...data.variables, // 包含模板文件 YAML 中定义的默认变量
      ...variables, // 使用传入的变量进行覆盖
    };

    // 使用 Mustache 渲染模板
    // 它会自动查找 markdownTemplate 中的 {{...}} 并用 view 对象中同名的键值替换
    const finalPrompt = Mustache.render(markdownTemplate, view);

    // 如果开启了调试模式，输出结果
    if (debug) {
      console.log("--- 解析出的元数据 (YAML Data) ---");
      console.log(data);

      console.log("\n--- 最终生成的 Prompt ---");
      console.log(finalPrompt);
    }

    return finalPrompt;
  } catch (error) {
    console.error("解析模板时出错:", error);
    throw new Error(`解析模板时出错: ${error instanceof Error ? error.message : String(error)}`);
  }
};
