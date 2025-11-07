import type { TwitterApi } from "twitter-api-v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetUserInfoTool } from "../src/tools/get-user-info.js";

const mockUserByUsernameFn = vi.hoisted(() => vi.fn());

describe("GetUserInfoTool", () => {
  let mockClient: TwitterApi;
  let getUserInfoTool: GetUserInfoTool;

  beforeEach(() => {
    mockUserByUsernameFn.mockClear();

    // Create a mock Twitter API client
    mockClient = {
      readWrite: {
        v2: {
          userByUsername: mockUserByUsernameFn,
        },
      },
    } as unknown as TwitterApi;

    getUserInfoTool = new GetUserInfoTool(mockClient);
  });

  it("should have correct name and description", () => {
    expect(getUserInfoTool.name).toBe("get_user_info");
    expect(getUserInfoTool.description).toBe("Retrieves basic profile information for a given user.");
  });

  it("should successfully fetch user info", async () => {
    const mockUserData = {
      data: {
        id: "123456789",
        username: "testuser",
        name: "Test User",
        description: "This is a test user",
        created_at: "2020-01-01T00:00:00.000Z",
        verified: true,
        location: "Test City",
        public_metrics: {
          followers_count: 100,
          following_count: 50,
          tweet_count: 200,
          listed_count: 5,
        },
      },
    };

    mockUserByUsernameFn.mockResolvedValue(mockUserData);

    const result = await getUserInfoTool.execute({ username: "testuser" });

    expect(mockUserByUsernameFn).toHaveBeenCalledWith("testuser", {
      "user.fields": ["created_at", "description", "public_metrics", "verified", "location"],
    });
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.user.id).toBe("123456789");
    expect(parsed.user.username).toBe("testuser");
    expect(parsed.user.name).toBe("Test User");
    expect(parsed.user.description).toBe("This is a test user");
    expect(parsed.user.verified).toBe(true);
    expect(parsed.user.location).toBe("Test City");
    expect(parsed.user.metrics).toEqual(mockUserData.data.public_metrics);
  });

  it("should handle user not found", async () => {
    mockUserByUsernameFn.mockResolvedValue({ data: null });

    const result = await getUserInfoTool.execute({ username: "nonexistentuser" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to fetch user info");
    expect(parsed.error).toContain("User @nonexistentuser was not found");
  });

  it("should return error response when API fails", async () => {
    const error = new Error("API error occurred");
    mockUserByUsernameFn.mockRejectedValue(error);

    const result = await getUserInfoTool.execute({ username: "testuser" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to fetch user info");
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
    mockUserByUsernameFn.mockRejectedValue(error);

    const result = await getUserInfoTool.execute({ username: "testuser" });

    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error_type).toBe("RATE_LIMIT_EXCEEDED");
    expect(parsed.details.rate_limit).toBeDefined();
  });
});
