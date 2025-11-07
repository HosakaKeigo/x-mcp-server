import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostTweetTool } from '../src/tools/post-tweet.js';
import type { TwitterApi } from 'twitter-api-v2';

const mockTweetFn = vi.hoisted(() => vi.fn());

describe('PostTweetTool', () => {
  let mockClient: TwitterApi;
  let postTweetTool: PostTweetTool;

  beforeEach(() => {
    mockTweetFn.mockClear();

    // Create a mock Twitter API client
    mockClient = {
      readWrite: {
        v2: {
          tweet: mockTweetFn,
        },
      },
    } as unknown as TwitterApi;

    postTweetTool = new PostTweetTool(mockClient);
  });

  it('should have correct name and description', () => {
    expect(postTweetTool.name).toBe('post_tweet');
    expect(postTweetTool.description).toBe('ツイート（ポスト）を投稿します');
  });

  it.each([
    {
      description: 'simple text',
      text: 'Hello, World!',
      tweetId: '1234567890',
    },
    {
      description: 'text with emojis',
      text: 'Testing with emojis 🚀✨',
      tweetId: '9876543210',
    },
  ])('should successfully post a tweet with $description', async ({ text, tweetId }) => {
    const mockTweetData = {
      data: {
        id: tweetId,
        text,
      },
    };

    mockTweetFn.mockResolvedValue(mockTweetData);

    const result = await postTweetTool.execute({ text });

    expect(mockTweetFn).toHaveBeenCalledWith(text);
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.tweet_id).toBe(tweetId);
    expect(parsed.text).toBe(text);
  });

  it('should return error response when tweet fails', async () => {
    const error = new Error('API rate limit exceeded');
    mockTweetFn.mockRejectedValue(error);

    const result = await postTweetTool.execute({ text: 'This will fail' });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('ツイートの投稿に失敗しました');
    expect(parsed.error).toContain('API rate limit exceeded');
  });

  it('should handle non-Error exceptions', async () => {
    mockTweetFn.mockRejectedValue('Network connection failed');

    const result = await postTweetTool.execute({ text: 'Test tweet' });

    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('ツイートの投稿に失敗しました');
    expect(parsed.error).toContain('Network connection failed');
  });
});
