import type { TwitterApi } from "twitter-api-v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RetweetTool } from "../src/tools/retweet.js";

const mockRetweetFn = vi.hoisted(() => vi.fn());
const mockMeFn = vi.hoisted(() => vi.fn());

describe("RetweetTool", () => {
  let mockClient: TwitterApi;
  let retweetTool: RetweetTool;

  beforeEach(() => {
    mockRetweetFn.mockClear();
    mockMeFn.mockClear();

    // Create a mock Twitter API client
    mockClient = {
      readWrite: {
        v2: {
          retweet: mockRetweetFn,
          me: mockMeFn,
        },
      },
    } as unknown as TwitterApi;

    retweetTool = new RetweetTool(mockClient);
  });

  it("should have correct name and description", () => {
    expect(retweetTool.name).toBe("retweet");
    expect(retweetTool.description).toBe("Retweets a post on behalf of the authenticated user.");
  });

  it.each([
    {
      description: "numeric tweet ID",
      tweetId: "1234567890",
      userId: "9876543210",
    },
    {
      description: "long numeric tweet ID",
      tweetId: "987654321012345678",
      userId: "0fedcba0987654321",
    },
  ])("should successfully retweet a tweet with $description", async ({ tweetId, userId }) => {
    const mockUserData = {
      data: {
        id: userId,
        username: "testuser",
      },
    };

    mockMeFn.mockResolvedValue(mockUserData);
    mockRetweetFn.mockResolvedValue({ data: { retweeted: true } });

    const result = await retweetTool.execute({ tweet_id: tweetId });

    expect(mockMeFn).toHaveBeenCalledTimes(1);
    expect(mockRetweetFn).toHaveBeenCalledWith(userId, tweetId);
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.message).toBe(`Retweeted tweet ${tweetId}.`);
  });

  it("should return error response when me() API fails", async () => {
    const error = new Error("Authentication failed");
    mockMeFn.mockRejectedValue(error);

    const result = await retweetTool.execute({ tweet_id: "1234567890" });

    expect(mockMeFn).toHaveBeenCalledTimes(1);
    expect(mockRetweetFn).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to retweet");
    expect(parsed.error).toContain("Authentication failed");
  });

  it("should return error response when retweet() API fails", async () => {
    const mockUserData = {
      data: {
        id: "123456",
        username: "testuser",
      },
    };

    mockMeFn.mockResolvedValue(mockUserData);

    const error = new Error("API rate limit exceeded");
    mockRetweetFn.mockRejectedValue(error);

    const result = await retweetTool.execute({ tweet_id: "1234567890" });

    expect(mockMeFn).toHaveBeenCalledTimes(1);
    expect(mockRetweetFn).toHaveBeenCalledWith("123456", "1234567890");
    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to retweet");
    expect(parsed.error).toContain("API rate limit exceeded");
  });

  it("should handle non-Error exceptions", async () => {
    mockMeFn.mockRejectedValue("Network connection failed");

    const result = await retweetTool.execute({ tweet_id: "1234567890" });

    expect(mockMeFn).toHaveBeenCalledTimes(1);
    expect(mockRetweetFn).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to retweet");
    expect(parsed.error).toContain("Network connection failed");
  });

  it("should validate tweet_id schema", () => {
    const schema = retweetTool.parameters.tweet_id;
    expect(schema.safeParse("1234567890").success).toBe(true);
    expect(schema.safeParse("tweet123").success).toBe(false);
    expect(schema.safeParse("123456789012345678901").success).toBe(false);
  });
});
