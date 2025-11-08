import type { TwitterApi } from "twitter-api-v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetHomeTimelineTool } from "../src/tools/get-home-timeline.js";

const mockHomeTimelineFn = vi.hoisted(() => vi.fn());

describe("GetHomeTimelineTool", () => {
  let mockClient: TwitterApi;
  let getHomeTimelineTool: GetHomeTimelineTool;

  beforeEach(() => {
    mockHomeTimelineFn.mockClear();

    // Create a mock Twitter API client
    mockClient = {
      readWrite: {
        v2: {
          homeTimeline: mockHomeTimelineFn,
        },
      },
    } as unknown as TwitterApi;

    getHomeTimelineTool = new GetHomeTimelineTool(mockClient);
  });

  it("should have correct name and description", () => {
    expect(getHomeTimelineTool.name).toBe("get_home_timeline");
    expect(getHomeTimelineTool.description).toBe(
      "Retrieves the authenticated user's home timeline."
    );
  });

  it("should successfully fetch home timeline with default count", async () => {
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

    mockHomeTimelineFn.mockResolvedValue({
      data: {
        data: mockTweets,
      },
    });

    const result = await getHomeTimelineTool.execute({});

    expect(mockHomeTimelineFn).toHaveBeenCalledWith({ max_results: 10 });
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(2);
    expect(parsed.tweets).toHaveLength(2);
    expect(parsed.tweets[0].id).toBe("1234567890");
    expect(parsed.tweets[0].text).toBe("Test tweet 1");
    expect(parsed.tweets[1].id).toBe("1234567891");
  });

  it("should successfully fetch home timeline with custom count", async () => {
    const mockTweets = Array.from({ length: 25 }, (_, i) => ({
      id: `${1234567890 + i}`,
      text: `Test tweet ${i + 1}`,
      created_at: "2024-01-01T00:00:00.000Z",
    }));

    mockHomeTimelineFn.mockResolvedValue({
      data: {
        data: mockTweets,
      },
    });

    const result = await getHomeTimelineTool.execute({ count: 25 });

    expect(mockHomeTimelineFn).toHaveBeenCalledWith({ max_results: 25 });
    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(25);
    expect(parsed.tweets).toHaveLength(25);
  });

  it("should cap count at 100", async () => {
    mockHomeTimelineFn.mockResolvedValue({
      data: {
        data: [],
      },
    });

    await getHomeTimelineTool.execute({ count: 150 });

    expect(mockHomeTimelineFn).toHaveBeenCalledWith({ max_results: 100 });
  });

  it("should handle empty timeline", async () => {
    mockHomeTimelineFn.mockResolvedValue({
      data: {
        data: [],
      },
    });

    const result = await getHomeTimelineTool.execute({});

    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(0);
    expect(parsed.tweets).toEqual([]);
  });

  it("should handle null timeline data", async () => {
    mockHomeTimelineFn.mockResolvedValue({
      data: {
        data: null,
      },
    });

    const result = await getHomeTimelineTool.execute({});

    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.count).toBe(0);
    expect(parsed.tweets).toEqual([]);
  });

  it("should return error response when API fails", async () => {
    const error = new Error("API error occurred");
    mockHomeTimelineFn.mockRejectedValue(error);

    const result = await getHomeTimelineTool.execute({});

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to fetch home timeline");
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
    mockHomeTimelineFn.mockRejectedValue(error);

    const result = await getHomeTimelineTool.execute({});

    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error_type).toBe("RATE_LIMIT_EXCEEDED");
    expect(parsed.details.rate_limit).toBeDefined();
  });
});
