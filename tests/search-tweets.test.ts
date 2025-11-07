import type { TwitterApi } from "twitter-api-v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchTweetsTool } from "../src/tools/search-tweets.js";

const mockSearchFn = vi.hoisted(() => vi.fn());

describe("SearchTweetsTool", () => {
  let mockClient: TwitterApi;
  let searchTweetsTool: SearchTweetsTool;

  beforeEach(() => {
    mockSearchFn.mockClear();

    // Create a mock Twitter API client
    mockClient = {
      readWrite: {
        v2: {
          search: mockSearchFn,
        },
      },
    } as unknown as TwitterApi;

    searchTweetsTool = new SearchTweetsTool(mockClient);
  });

  it("should have correct name and description", () => {
    expect(searchTweetsTool.name).toBe("search_tweets");
    expect(searchTweetsTool.description).toBe("Searches recent tweets by keyword.");
  });

  it("should successfully search tweets with default count", async () => {
    const mockTweets = [
      {
        id: "1234567890",
        text: "Test tweet about cats",
        created_at: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "1234567891",
        text: "Another tweet about cats",
        created_at: "2024-01-01T01:00:00.000Z",
      },
    ];

    mockSearchFn.mockResolvedValue({
      data: {
        data: mockTweets,
      },
    });

    const result = await searchTweetsTool.execute({ query: "cats" });

    expect(mockSearchFn).toHaveBeenCalledWith("cats", { max_results: 10 });
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.query).toBe("cats");
    expect(parsed.count).toBe(2);
    expect(parsed.tweets).toHaveLength(2);
    expect(parsed.tweets[0].id).toBe("1234567890");
    expect(parsed.tweets[0].text).toBe("Test tweet about cats");
  });

  it("should successfully search tweets with custom count", async () => {
    const mockTweets = Array.from({ length: 25 }, (_, i) => ({
      id: `${1234567890 + i}`,
      text: `Test tweet ${i + 1}`,
      created_at: "2024-01-01T00:00:00.000Z",
    }));

    mockSearchFn.mockResolvedValue({
      data: {
        data: mockTweets,
      },
    });

    const result = await searchTweetsTool.execute({ query: "test", count: 25 });

    expect(mockSearchFn).toHaveBeenCalledWith("test", { max_results: 25 });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(25);
    expect(parsed.tweets).toHaveLength(25);
  });

  it("should cap count at 100", async () => {
    mockSearchFn.mockResolvedValue({
      data: {
        data: [],
      },
    });

    await searchTweetsTool.execute({ query: "test", count: 150 });

    expect(mockSearchFn).toHaveBeenCalledWith("test", { max_results: 100 });
  });

  it("should handle empty search results", async () => {
    mockSearchFn.mockResolvedValue({
      data: {
        data: [],
      },
    });

    const result = await searchTweetsTool.execute({ query: "nonexistentquery" });

    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(0);
    expect(parsed.tweets).toEqual([]);
  });

  it("should handle null search results", async () => {
    mockSearchFn.mockResolvedValue({
      data: {
        data: null,
      },
    });

    const result = await searchTweetsTool.execute({ query: "test" });

    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(0);
    expect(parsed.tweets).toEqual([]);
  });

  it("should handle undefined search results", async () => {
    mockSearchFn.mockResolvedValue({
      data: {
        data: undefined,
      },
    });

    const result = await searchTweetsTool.execute({ query: "test" });

    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(0);
    expect(parsed.tweets).toEqual([]);
  });

  it("should return error response when API fails", async () => {
    const error = new Error("API error occurred");
    mockSearchFn.mockRejectedValue(error);

    const result = await searchTweetsTool.execute({ query: "test" });

    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to search tweets");
    expect(parsed.error).toContain("API error occurred");
  });

  it("should handle rate limit error", async () => {
    const error = {
      code: 429,
      rateLimitError: true,
      message: "Rate limit exceeded",
      rateLimit: {
        limit: 50,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 900,
      },
    };
    mockSearchFn.mockRejectedValue(error);

    const result = await searchTweetsTool.execute({ query: "test" });

    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error_type).toBe("RATE_LIMIT_EXCEEDED");
    expect(parsed.details.rate_limit).toBeDefined();
  });

  it("should handle complex search queries", async () => {
    const mockTweets = [
      {
        id: "1234567890",
        text: "Test tweet",
        created_at: "2024-01-01T00:00:00.000Z",
      },
    ];

    mockSearchFn.mockResolvedValue({
      data: {
        data: mockTweets,
      },
    });

    const result = await searchTweetsTool.execute({ query: "cats OR dogs -birds" });

    expect(mockSearchFn).toHaveBeenCalledWith("cats OR dogs -birds", { max_results: 10 });
    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.query).toBe("cats OR dogs -birds");
    expect(parsed.success).toBe(true);
  });
});
