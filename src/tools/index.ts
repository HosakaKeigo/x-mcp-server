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
 * Registers every MCP tool with the given server instance so the client can
 * discover and invoke them over the protocol.
 * @param server - Active MCP server
 * @param twitterClient - Authenticated Twitter API client injected into tools
 */
export function registerTools(server: McpServer, twitterClient: TwitterApi): void {
  const ALL_TOOLS: IMCPTool[] = [
    new PostTweetTool(twitterClient),
    new GetHomeTimelineTool(twitterClient),
    new GetUserTweetsTool(twitterClient),
    new SearchTweetsTool(twitterClient),
    new GetUserInfoTool(twitterClient),
    new LikeTweetTool(twitterClient),
    new RetweetTool(twitterClient),
  ];

  for (const tool of ALL_TOOLS) {
    server.tool(tool.name, tool.description, tool.parameters, tool.execute.bind(tool));
  }
}
