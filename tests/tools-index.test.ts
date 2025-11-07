import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TwitterApi } from "twitter-api-v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerTools } from "../src/tools/index.js";

describe("registerTools", () => {
  let mockServer: McpServer;
  let mockTwitterClient: TwitterApi;
  let mockToolFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockToolFn = vi.fn();

    // Create a mock MCP server
    mockServer = {
      tool: mockToolFn,
    } as unknown as McpServer;

    // Create a mock Twitter API client
    mockTwitterClient = {} as TwitterApi;
  });

  it("should register all tools with the server", () => {
    registerTools(mockServer, mockTwitterClient);

    // Verify that tool() was called 7 times (one for each tool)
    expect(mockToolFn).toHaveBeenCalledTimes(7);

    // Get all tool names that were registered
    const registeredToolNames = mockToolFn.mock.calls.map((call) => call[0]);

    // Verify all expected tools were registered
    expect(registeredToolNames).toContain("post_tweet");
    expect(registeredToolNames).toContain("get_home_timeline");
    expect(registeredToolNames).toContain("get_user_tweets");
    expect(registeredToolNames).toContain("search_tweets");
    expect(registeredToolNames).toContain("get_user_info");
    expect(registeredToolNames).toContain("like_tweet");
    expect(registeredToolNames).toContain("retweet");
  });

  it("should register post_tweet tool with correct parameters", () => {
    registerTools(mockServer, mockTwitterClient);

    const postTweetCall = mockToolFn.mock.calls.find((call) => call[0] === "post_tweet");
    expect(postTweetCall).toBeDefined();
    expect(postTweetCall?.[0]).toBe("post_tweet");
    expect(postTweetCall?.[1]).toBe("Posts a tweet on behalf of the authenticated user.");
    expect(postTweetCall?.[2]).toBeDefined(); // parameters
    expect(postTweetCall?.[3]).toBeInstanceOf(Function); // execute function
  });

  it("should register get_home_timeline tool with correct parameters", () => {
    registerTools(mockServer, mockTwitterClient);

    const getHomeTimelineCall = mockToolFn.mock.calls.find((call) => call[0] === "get_home_timeline");
    expect(getHomeTimelineCall).toBeDefined();
    expect(getHomeTimelineCall?.[0]).toBe("get_home_timeline");
    expect(getHomeTimelineCall?.[1]).toBe("Retrieves the authenticated user's home timeline.");
    expect(getHomeTimelineCall?.[2]).toBeDefined();
    expect(getHomeTimelineCall?.[3]).toBeInstanceOf(Function);
  });

  it("should register get_user_tweets tool with correct parameters", () => {
    registerTools(mockServer, mockTwitterClient);

    const getUserTweetsCall = mockToolFn.mock.calls.find((call) => call[0] === "get_user_tweets");
    expect(getUserTweetsCall).toBeDefined();
    expect(getUserTweetsCall?.[0]).toBe("get_user_tweets");
    expect(getUserTweetsCall?.[1]).toBe("Retrieves recent tweets for a specific user.");
    expect(getUserTweetsCall?.[2]).toBeDefined();
    expect(getUserTweetsCall?.[3]).toBeInstanceOf(Function);
  });

  it("should register search_tweets tool with correct parameters", () => {
    registerTools(mockServer, mockTwitterClient);

    const searchTweetsCall = mockToolFn.mock.calls.find((call) => call[0] === "search_tweets");
    expect(searchTweetsCall).toBeDefined();
    expect(searchTweetsCall?.[0]).toBe("search_tweets");
    expect(searchTweetsCall?.[1]).toBe("Searches recent tweets by keyword.");
    expect(searchTweetsCall?.[2]).toBeDefined();
    expect(searchTweetsCall?.[3]).toBeInstanceOf(Function);
  });

  it("should register get_user_info tool with correct parameters", () => {
    registerTools(mockServer, mockTwitterClient);

    const getUserInfoCall = mockToolFn.mock.calls.find((call) => call[0] === "get_user_info");
    expect(getUserInfoCall).toBeDefined();
    expect(getUserInfoCall?.[0]).toBe("get_user_info");
    expect(getUserInfoCall?.[1]).toBe("Retrieves basic profile information for a given user.");
    expect(getUserInfoCall?.[2]).toBeDefined();
    expect(getUserInfoCall?.[3]).toBeInstanceOf(Function);
  });

  it("should register like_tweet tool with correct parameters", () => {
    registerTools(mockServer, mockTwitterClient);

    const likeTweetCall = mockToolFn.mock.calls.find((call) => call[0] === "like_tweet");
    expect(likeTweetCall).toBeDefined();
    expect(likeTweetCall?.[0]).toBe("like_tweet");
    expect(likeTweetCall?.[1]).toBe("Likes a tweet on behalf of the authenticated user.");
    expect(likeTweetCall?.[2]).toBeDefined();
    expect(likeTweetCall?.[3]).toBeInstanceOf(Function);
  });

  it("should register retweet tool with correct parameters", () => {
    registerTools(mockServer, mockTwitterClient);

    const retweetCall = mockToolFn.mock.calls.find((call) => call[0] === "retweet");
    expect(retweetCall).toBeDefined();
    expect(retweetCall?.[0]).toBe("retweet");
    expect(retweetCall?.[1]).toBe("Retweets a post on behalf of the authenticated user.");
    expect(retweetCall?.[2]).toBeDefined();
    expect(retweetCall?.[3]).toBeInstanceOf(Function);
  });

  it("should bind execute methods to their tool instances", () => {
    registerTools(mockServer, mockTwitterClient);

    // Each registered execute function should be bound to its tool instance
    for (const call of mockToolFn.mock.calls) {
      const executeFn = call[3];
      expect(executeFn).toBeInstanceOf(Function);
    }
  });
});
