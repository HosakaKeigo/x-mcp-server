import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetweetTool } from '../src/tools/retweet.js';
import type { TwitterApi } from 'twitter-api-v2';

const mockRetweetFn = vi.hoisted(() => vi.fn());
const mockMeFn = vi.hoisted(() => vi.fn());

describe('RetweetTool', () => {
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

  it('should have correct name and description', () => {
    expect(retweetTool.name).toBe('retweet');
    expect(retweetTool.description).toBe('ツイートをリツイートします');
  });

  it.each([
    {
      description: 'numeric tweet ID',
      tweetId: '1234567890',
      userId: '9876543210',
    },
    {
      description: 'alphanumeric tweet ID',
      tweetId: '1234567890abcdef',
      userId: '0fedcba0987654321',
    },
  ])('should successfully retweet a tweet with $description', async ({ tweetId, userId }) => {
    const mockUserData = {
      data: {
        id: userId,
        username: 'testuser',
      },
    };

    mockMeFn.mockResolvedValue(mockUserData);
    mockRetweetFn.mockResolvedValue({ data: { retweeted: true } });

    const result = await retweetTool.execute({ tweet_id: tweetId });

    expect(mockMeFn).toHaveBeenCalledTimes(1);
    expect(mockRetweetFn).toHaveBeenCalledWith(userId, tweetId);
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.message).toBe(`ツイート ${tweetId} をリツイートしました`);
  });

  it('should return error response when me() API fails', async () => {
    const error = new Error('Authentication failed');
    mockMeFn.mockRejectedValue(error);

    const result = await retweetTool.execute({ tweet_id: '1234567890' });

    expect(mockMeFn).toHaveBeenCalledTimes(1);
    expect(mockRetweetFn).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('リツイートに失敗しました');
    expect(parsed.error).toContain('Authentication failed');
  });

  it('should return error response when retweet() API fails', async () => {
    const mockUserData = {
      data: {
        id: '123456',
        username: 'testuser',
      },
    };

    mockMeFn.mockResolvedValue(mockUserData);

    const error = new Error('API rate limit exceeded');
    mockRetweetFn.mockRejectedValue(error);

    const result = await retweetTool.execute({ tweet_id: '1234567890' });

    expect(mockMeFn).toHaveBeenCalledTimes(1);
    expect(mockRetweetFn).toHaveBeenCalledWith('123456', '1234567890');
    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('リツイートに失敗しました');
    expect(parsed.error).toContain('API rate limit exceeded');
  });

  it('should handle non-Error exceptions', async () => {
    mockMeFn.mockRejectedValue('Network connection failed');

    const result = await retweetTool.execute({ tweet_id: '1234567890' });

    expect(mockMeFn).toHaveBeenCalledTimes(1);
    expect(mockRetweetFn).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('リツイートに失敗しました');
    expect(parsed.error).toContain('Network connection failed');
  });
});
