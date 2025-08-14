/**
 * @file Agents 入口点
 * @description 统一导出所有重构后的函数式 Agent。
 */

// 分析师
export { analyzeFundamentals } from "./analysts/FundamentalsAnalyst";
export { analyzeMarket } from "./analysts/MarketAnalyst";
export { analyzeNews } from "./analysts/NewsAnalyst";
export { analyzeSocialMedia } from "./analysts/SocialMediaAnalyst";

// 管理者
// export { manageResearch } from "./managers/ResearchManager";
// export { manageRisk } from "./managers/RiskManager";

// // 研究员
// export { researchBear } from "./researchers/BearResearcher";
// export { researchBull } from "./researchers/BullResearcher";

// // 风险辩手
// export { debateAggressive } from "./risk_mgmt/AggressiveDebator";
// export { debateConservative } from "./risk_mgmt/ConservativeDebator";
// export { debateNeutral } from "./risk_mgmt/NeutralDebator";

// 交易员
export { createTradePlan } from "./trader/Trader"; // 交易员生成最终交易提案的能力
export type { TradePlan } from "./trader/Trader";
