import type { TwitterApi } from "twitter-api-v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LikeTweetTool } from "../src/tools/like-tweet.js";

const mockLikeFn = vi.hoisted(() => vi.fn());
const mockMeFn = vi.hoisted(() => vi.fn());

describe("LikeTweetTool", () => {
  let mockClient: TwitterApi;
  let likeTweetTool: LikeTweetTool;

  beforeEach(() => {
    mockLikeFn.mockClear();
    mockMeFn.mockClear();

    // Create a mock Twitter API client
    mockClient = {
      readWrite: {
        v2: {
          like: mockLikeFn,
          me: mockMeFn,
        },
      },
    } as unknown as TwitterApi;

    likeTweetTool = new LikeTweetTool(mockClient);
  });

  it("should have correct name and description", () => {
    expect(likeTweetTool.name).toBe("like_tweet");
    expect(likeTweetTool.description).toBe("Likes a tweet on behalf of the authenticated user.");
  });

  it.each([
    {
      description: "numeric tweet ID",
      tweetId: "1234567890",
      userId: "9876543210",
    },
    {
      description: "alphanumeric tweet ID",
      tweetId: "1234567890abcdef",
      userId: "0fedcba0987654321",
    },
  ])("should successfully like a tweet with $description", async ({ tweetId, userId }) => {
    const mockUserData = {
      data: {
        id: userId,
        username: "testuser",
      },
    };

    mockMeFn.mockResolvedValue(mockUserData);
    mockLikeFn.mockResolvedValue({ data: { liked: true } });

    const result = await likeTweetTool.execute({ tweet_id: tweetId });

    expect(mockMeFn).toHaveBeenCalledTimes(1);
    expect(mockLikeFn).toHaveBeenCalledWith(userId, tweetId);
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.message).toBe(`Liked tweet ${tweetId}.`);
  });

  it("should return error response when me() API fails", async () => {
    const error = new Error("Authentication failed");
    mockMeFn.mockRejectedValue(error);

    const result = await likeTweetTool.execute({ tweet_id: "1234567890" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to like tweet");
    expect(parsed.error).toContain("Authentication failed");
  });

  it("should return error response when like() API fails", async () => {
    const mockUserData = {
      data: {
        id: "123456",
        username: "testuser",
      },
    };

    mockMeFn.mockResolvedValue(mockUserData);

    const error = new Error("API rate limit exceeded");
    mockLikeFn.mockRejectedValue(error);

    const result = await likeTweetTool.execute({ tweet_id: "1234567890" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to like tweet");
    expect(parsed.error).toContain("API rate limit exceeded");
  });

  it("should handle non-Error exceptions", async () => {
    mockMeFn.mockRejectedValue("Network connection failed");

    const result = await likeTweetTool.execute({ tweet_id: "1234567890" });

    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to like tweet");
    expect(parsed.error).toContain("Network connection failed");
  });
});
