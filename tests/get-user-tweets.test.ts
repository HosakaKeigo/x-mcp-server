import type { TwitterApi } from "twitter-api-v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetUserTweetsTool } from "../src/tools/get-user-tweets.js";

const mockUserByUsernameFn = vi.hoisted(() => vi.fn());
const mockUserTimelineFn = vi.hoisted(() => vi.fn());

describe("GetUserTweetsTool", () => {
  let mockClient: TwitterApi;
  let getUserTweetsTool: GetUserTweetsTool;

  beforeEach(() => {
    mockUserByUsernameFn.mockClear();
    mockUserTimelineFn.mockClear();

    // Create a mock Twitter API client
    mockClient = {
      readWrite: {
        v2: {
          userByUsername: mockUserByUsernameFn,
          userTimeline: mockUserTimelineFn,
        },
      },
    } as unknown as TwitterApi;

    getUserTweetsTool = new GetUserTweetsTool(mockClient);
  });

  it("should have correct name and description", () => {
    expect(getUserTweetsTool.name).toBe("get_user_tweets");
    expect(getUserTweetsTool.description).toBe("Retrieves recent tweets for a specific user.");
  });

  it("should successfully fetch user tweets with default count", async () => {
    const mockUserData = {
      data: {
        id: "123456789",
        username: "testuser",
      },
    };

    const mockTweets = [
      {
        id: "1234567890",
        text: "Test tweet 1",
        created_at: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "1234567891",
        text: "Test tweet 2",
        created_at: "2024-01-01T01:00:00.000Z",
      },
    ];

    mockUserByUsernameFn.mockResolvedValue(mockUserData);
    mockUserTimelineFn.mockResolvedValue({
      data: {
        data: mockTweets,
      },
    });

    const result = await getUserTweetsTool.execute({ username: "testuser" });

    expect(mockUserByUsernameFn).toHaveBeenCalledWith("testuser");
    expect(mockUserTimelineFn).toHaveBeenCalledWith("123456789", { max_results: 10 });
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.username).toBe("testuser");
    expect(parsed.count).toBe(2);
    expect(parsed.tweets).toHaveLength(2);
    expect(parsed.tweets[0].id).toBe("1234567890");
    expect(parsed.tweets[0].text).toBe("Test tweet 1");
  });

  it("should successfully fetch user tweets with custom count", async () => {
    const mockUserData = {
      data: {
        id: "123456789",
        username: "testuser",
      },
    };

    const mockTweets = Array.from({ length: 25 }, (_, i) => ({
      id: `${1234567890 + i}`,
      text: `Test tweet ${i + 1}`,
      created_at: "2024-01-01T00:00:00.000Z",
    }));

    mockUserByUsernameFn.mockResolvedValue(mockUserData);
    mockUserTimelineFn.mockResolvedValue({
      data: {
        data: mockTweets,
      },
    });

    const result = await getUserTweetsTool.execute({ username: "testuser", count: 25 });

    expect(mockUserTimelineFn).toHaveBeenCalledWith("123456789", { max_results: 25 });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(25);
    expect(parsed.tweets).toHaveLength(25);
  });

  it("should cap count at 100", async () => {
    const mockUserData = {
      data: {
        id: "123456789",
        username: "testuser",
      },
    };

    mockUserByUsernameFn.mockResolvedValue(mockUserData);
    mockUserTimelineFn.mockResolvedValue({
      data: {
        data: [],
      },
    });

    await getUserTweetsTool.execute({ username: "testuser", count: 150 });

    expect(mockUserTimelineFn).toHaveBeenCalledWith("123456789", { max_results: 100 });
  });

  it("should handle user not found", async () => {
    mockUserByUsernameFn.mockResolvedValue({ data: null });

    const result = await getUserTweetsTool.execute({ username: "nonexistentuser" });

    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to fetch user tweets");
    expect(parsed.error).toContain("User @nonexistentuser was not found");
  });

  it("should handle empty tweet list", async () => {
    const mockUserData = {
      data: {
        id: "123456789",
        username: "testuser",
      },
    };

    mockUserByUsernameFn.mockResolvedValue(mockUserData);
    mockUserTimelineFn.mockResolvedValue({
      data: {
        data: [],
      },
    });

    const result = await getUserTweetsTool.execute({ username: "testuser" });

    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(0);
    expect(parsed.tweets).toEqual([]);
  });

  it("should handle null tweet data", async () => {
    const mockUserData = {
      data: {
        id: "123456789",
        username: "testuser",
      },
    };

    mockUserByUsernameFn.mockResolvedValue(mockUserData);
    mockUserTimelineFn.mockResolvedValue({
      data: {
        data: null,
      },
    });

    const result = await getUserTweetsTool.execute({ username: "testuser" });

    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(0);
    expect(parsed.tweets).toEqual([]);
  });

  it("should handle undefined tweet data", async () => {
    const mockUserData = {
      data: {
        id: "123456789",
        username: "testuser",
      },
    };

    mockUserByUsernameFn.mockResolvedValue(mockUserData);
    mockUserTimelineFn.mockResolvedValue({
      data: {
        data: undefined,
      },
    });

    const result = await getUserTweetsTool.execute({ username: "testuser" });

    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(0);
    expect(parsed.tweets).toEqual([]);
  });

  it("should return error response when userByUsername fails", async () => {
    const error = new Error("API error occurred");
    mockUserByUsernameFn.mockRejectedValue(error);

    const result = await getUserTweetsTool.execute({ username: "testuser" });

    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to fetch user tweets");
    expect(parsed.error).toContain("API error occurred");
  });

  it("should return error response when userTimeline fails", async () => {
    const mockUserData = {
      data: {
        id: "123456789",
        username: "testuser",
      },
    };

    mockUserByUsernameFn.mockResolvedValue(mockUserData);

    const error = new Error("Timeline API error");
    mockUserTimelineFn.mockRejectedValue(error);

    const result = await getUserTweetsTool.execute({ username: "testuser" });

    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to fetch user tweets");
    expect(parsed.error).toContain("Timeline API error");
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
    mockUserByUsernameFn.mockRejectedValue(error);

    const result = await getUserTweetsTool.execute({ username: "testuser" });

    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error_type).toBe("RATE_LIMIT_EXCEEDED");
    expect(parsed.details.rate_limit).toBeDefined();
  });
});
