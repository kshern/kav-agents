/**
 * @file 社交媒体分析师 Agent
 * @description 定义了用于分析社交媒体情绪的函数。
 */

// import { fetchTopFromCategory } from "../../../dataflows/redditUtils";
import { parseAndRenderTemplate } from "../../../utils";
import { loadTemplate } from "../../../utils/templateLoader"; // 动态加载模板，兼容Vite和Node环境
import { generateContent } from "../../../models/gateway";
import { getModelConfig } from "../../../config/models"; // 集中式模型配置
import type { SocialMediaAnalystProps } from "../../../types"; // 统一使用集中定义的 Props 类型
// 定义社交媒体帖子的结构
export interface SocialMediaPost {
  title: string; // 标题
  content: string; // 内容
  upvotes: number; // 赞数
  url: string; // 链接
}

// 提示：如需扩展 Reddit 数据源，可在类型层统一维护，避免在此文件重复定义
/**
 * 格式化 Reddit 帖子列表为字符串。
 * @param posts - Reddit 帖子对象数组。
 * @returns - 格式化后的字符串。
 */
function formatRedditPosts(posts: SocialMediaPost[]): string {
  return posts
    .slice(0, 10) // 最多展示10条
    .map(
      (post) => `
      - 标题: ${post.title}
      - 内容: ${post.content.substring(0, 200)}...
      - 赞数: ${post.upvotes}
      - 链接: ${post.url}
    `,
    )
    .join("\n");
}

/**
 * 获取并分析给定公司的社交媒体帖子，然后生成报告。
 * @param props - 当前的 Agent 需要的参数，包含公司代码和交易日期。
 * @returns - 返回一个包含社交媒体情绪报告的对象。
 */
export async function analyzeSocialMedia(
  props: SocialMediaAnalystProps,
): Promise<{ sentiment_report: string }> {
  const { company_of_interest, trade_date, modelConfig } = props;

  try {
    // 1. 获取 Reddit 数据
    // const redditPosts = await fetchTopFromCategory(
    //   "company_news",
    //   trade_date,
    //   20,
    //   company_of_interest,
    //   "reddit_data"
    // );
    const redditPosts: SocialMediaPost[] = [];
    if (redditPosts.length === 0) {
      return { sentiment_report: "未找到相关的社交媒体帖子。" };
    }

    // 2. 格式化帖子并构建提示
    const formattedPosts = formatRedditPosts(redditPosts);
    // 动态加载社交媒体分析模板
    const template = await loadTemplate("social.md", import.meta.url);
    const prompt = parseAndRenderTemplate(template, {
      reddit_posts: formattedPosts,
    }); // 用统一工具渲染模板

    // 3. 计算有效模型并生成报告（优先使用注入，其次回退到集中默认）
    const effectiveModel = modelConfig ?? getModelConfig("socialMediaAnalyst");
    const result = await generateContent({
      modelConfig: effectiveModel,
      prompt,
    });

    return { sentiment_report: result };
  } catch (error) {
    console.error("Error generating sentiment report:", error);
    return { sentiment_report: "生成社交媒体情绪报告时出错。" };
  }
}
