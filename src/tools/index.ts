import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TwitterApi } from "twitter-api-v2";
import type { IMCPTool } from "../types/index.js";
import { GetHomeTimelineTool } from "./get-home-timeline.js";
import { GetUserInfoTool } from "./get-user-info.js";
import { GetUserTweetsTool } from "./get-user-tweets.js";
import { LikeTweetTool } from "./like-tweet.js";
import { PostTweetTool } from "./post-tweet.js";
import { RetweetTool } from "./retweet.js";
import { SearchTweetsTool } from "./search-tweets.js";

/**
 * ツール登録関数
 * すべてのツールをサーバーに登録
 * @param server MCPサーバーインスタンス
 * @param twitterClient Twitter APIクライアント
 */
export function registerTools(server: McpServer, twitterClient: TwitterApi): void {
  // すべてのツールを初期化
  const ALL_TOOLS: IMCPTool[] = [
    new PostTweetTool(twitterClient),
    new GetHomeTimelineTool(twitterClient),
    new GetUserTweetsTool(twitterClient),
    new SearchTweetsTool(twitterClient),
    new GetUserInfoTool(twitterClient),
    new LikeTweetTool(twitterClient),
    new RetweetTool(twitterClient),
  ];

  // 各ツールをサーバーに登録
  for (const tool of ALL_TOOLS) {
    server.tool(tool.name, tool.description, tool.parameters, tool.execute.bind(tool));
  }
}
