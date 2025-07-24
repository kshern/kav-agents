/**
 * @file 社交媒体分析师 Agent
 * @description 定义了用于分析社交媒体情绪的函数。
 */

import { fetchTopFromCategory } from "../../../dataflows/redditUtils";
import { fillPromptTemplate } from "../../utils";
import { SocialMediaAnalystProps, SocialMediaPost } from "../../../types";
import socialTemplate from "./social.md?raw";
import { generateContent } from "../../utils/geminiUtils";

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
    `
    )
    .join("\n");
}

/**
 * 获取并分析给定公司的社交媒体帖子，然后生成报告。
 * @param props - 当前的 Agent 需要的参数，包含公司代码和交易日期。
 * @returns - 返回一个包含社交媒体情绪报告的对象。
 */
export async function analyzeSocialMedia(props: {
  company_of_interest: string;
  trade_date: string;
}): Promise<{ sentiment_report: string }> {
  const { company_of_interest, trade_date } = props;

  try {
    // 1. 获取 Reddit 数据
    const redditPosts = await fetchTopFromCategory(
      "company_news",
      trade_date,
      20,
      company_of_interest,
      "reddit_data"
    );

    if (redditPosts.length === 0) {
      return { sentiment_report: "未找到相关的社交媒体帖子。" };
    }

    // 2. 格式化帖子并构建提示
    const formattedPosts = formatRedditPosts(redditPosts);
    const prompt = fillPromptTemplate(socialTemplate, {
      reddit_posts: formattedPosts,
    });

    const result = await generateContent({
      modelName: "gemini-2.0-flash-lite",
      prompt
    });

    return { sentiment_report: result };
  } catch (error) {
    console.error("Error generating sentiment report:", error);
    return { sentiment_report: "生成社交媒体情绪报告时出错。" };
  }
}
