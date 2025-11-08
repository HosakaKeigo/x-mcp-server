import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TwitterApi } from "twitter-api-v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerTools } from "../src/tools/index.js";

describe("registerTools", () => {
  let mockServer: McpServer;
  let mockTwitterClient: TwitterApi;
  let mockRegisterToolFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRegisterToolFn = vi.fn();

    // Create a mock MCP server with registerTool method
    mockServer = {
      registerTool: mockRegisterToolFn,
    } as unknown as McpServer;

    // Create a mock Twitter API client
    mockTwitterClient = {} as TwitterApi;
  });

  it("should register all tools with the server", () => {
    registerTools(mockServer, mockTwitterClient);

    // Verify that registerTool() was called 7 times (one for each tool)
    expect(mockRegisterToolFn).toHaveBeenCalledTimes(7);

    // Get all tool names that were registered
    const registeredToolNames = mockRegisterToolFn.mock.calls.map((call) => call[0]);

    // Verify all expected tools were registered
    expect(registeredToolNames).toContain("post_tweet");
    expect(registeredToolNames).toContain("get_home_timeline");
    expect(registeredToolNames).toContain("get_user_tweets");
    expect(registeredToolNames).toContain("search_tweets");
    expect(registeredToolNames).toContain("get_user_info");
    expect(registeredToolNames).toContain("like_tweet");
    expect(registeredToolNames).toContain("retweet");
  });

  const toolRegistrations = [
    { name: "post_tweet", description: "Posts a tweet on behalf of the authenticated user." },
    { name: "get_home_timeline", description: "Retrieves the authenticated user's home timeline." },
    { name: "get_user_tweets", description: "Retrieves recent tweets for a specific user." },
    { name: "search_tweets", description: "Searches recent tweets by keyword." },
    { name: "get_user_info", description: "Retrieves basic profile information for a given user." },
    { name: "like_tweet", description: "Likes a tweet on behalf of the authenticated user." },
    { name: "retweet", description: "Retweets a post on behalf of the authenticated user." },
  ];

  it.each(toolRegistrations)("should register $name tool with correct parameters", ({ name, description }) => {
    registerTools(mockServer, mockTwitterClient);

    const toolCall = mockRegisterToolFn.mock.calls.find((call) => call[0] === name);
    expect(toolCall).toBeDefined();
    expect(toolCall?.[0]).toBe(name);
    expect(toolCall?.[1]).toHaveProperty("description", description);
    expect(toolCall?.[1]).toHaveProperty("inputSchema"); // parameters
    expect(toolCall?.[1]).toHaveProperty("outputSchema"); // output schema
    expect(toolCall?.[2]).toBeInstanceOf(Function); // execute function
  });
});
