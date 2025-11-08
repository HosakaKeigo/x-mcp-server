#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TwitterApi } from "twitter-api-v2";
import { env } from "./env.js";
import { registerTools } from "./tools/index.js";

/**
 * Bootstraps the X (Twitter) MCP server, registers all tools, and connects it
 * to the MCP stdio transport expected by Claude Desktop and other clients.
 */
async function main() {
  const SERVER_NAME = "x-mcp-server";
  const SERVER_VERSION = "0.1.0";

  try {
    const twitterClient = new TwitterApi({
      appKey: env.X_API_KEY,
      appSecret: env.X_API_SECRET,
      accessToken: env.X_ACCESS_TOKEN,
      accessSecret: env.X_ACCESS_TOKEN_SECRET,
    });

    const server = new McpServer({
      name: SERVER_NAME,
      version: SERVER_VERSION,
      capabilities: {
        tools: {},
      },
    });

    registerTools(server, twitterClient);

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
