#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TwitterApi } from "twitter-api-v2";
import { registerTools } from "./tools/index.js";

/**
 * X (Twitter) MCP Server のメインクラス
 */
async function main() {
  const SERVER_NAME = "x-mcp-server";
  const SERVER_VERSION = "0.1.0";

  try {
    // 環境変数からTwitter API認証情報を取得
    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY || "",
      appSecret: process.env.TWITTER_API_SECRET || "",
      accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || "",
    });

    // MCPサーバーのインスタンスを作成
    const server = new McpServer({
      name: SERVER_NAME,
      version: SERVER_VERSION,
      capabilities: {
        tools: {},
      },
    });

    // ツールを登録
    registerTools(server, twitterClient);

    // Stdio transportを初期化して接続
    const transport = new StdioServerTransport();
    console.error(`${SERVER_NAME} v${SERVER_VERSION} starting...`);
    await server.connect(transport);
    console.error(`${SERVER_NAME} connected and ready`);
  } catch (error) {
    console.error("Fatal error initializing server:", error);
    process.exit(1);
  }
}

main();
