import type { TwitterApi } from "twitter-api-v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PostTweetTool } from "../src/tools/post-tweet.js";

const mockTweetFn = vi.hoisted(() => vi.fn());
const mockUploadImage = vi.hoisted(() => vi.fn());
const mockUploadVideo = vi.hoisted(() => vi.fn());

vi.mock("../src/utils/media-upload.js", () => ({
	uploadImage: mockUploadImage,
	uploadVideo: mockUploadVideo,
}));

describe("PostTweetTool", () => {
  let mockClient: TwitterApi;
  let postTweetTool: PostTweetTool;

  beforeEach(() => {
    mockTweetFn.mockClear();
    mockUploadImage.mockClear();
    mockUploadVideo.mockClear();

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

  it("should have correct name and description", () => {
    expect(postTweetTool.name).toBe("post_tweet");
    expect(postTweetTool.description).toBe("Posts a tweet on behalf of the authenticated user.");
  });

  it.each([
    {
      description: "simple text",
      text: "Hello, World!",
      tweetId: "1234567890",
    },
    {
      description: "text with emojis",
      text: "Testing with emojis 🚀✨",
      tweetId: "9876543210",
    },
  ])("should successfully post a tweet with $description", async ({ text, tweetId }) => {
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
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.tweet_id).toBe(tweetId);
    expect(parsed.text).toBe(text);
  });

  it("should return error response when tweet fails", async () => {
    const error = new Error("API rate limit exceeded");
    mockTweetFn.mockRejectedValue(error);

    const result = await postTweetTool.execute({ text: "This will fail" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to post tweet");
    expect(parsed.error).toContain("API rate limit exceeded");
  });

  it("should handle non-Error exceptions", async () => {
    mockTweetFn.mockRejectedValue("Network connection failed");

    const result = await postTweetTool.execute({ text: "Test tweet" });

    expect(result.isError).toBe(true);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to post tweet");
    expect(parsed.error).toContain("Network connection failed");
  });

  it("should successfully post a tweet with an image", async () => {
    const text = "Check out this image!";
    const imagePath = "/path/to/image.png";
    const mockMediaId = "1234567890";
    const tweetId = "9876543210";

    mockUploadImage.mockResolvedValue(mockMediaId);
    mockTweetFn.mockResolvedValue({
      data: {
        id: tweetId,
        text,
      },
    });

    const result = await postTweetTool.execute({ text, image_path: imagePath });

    expect(mockUploadImage).toHaveBeenCalledWith(mockClient, imagePath);
    expect(mockTweetFn).toHaveBeenCalledWith({
      text,
      media: { media_ids: [mockMediaId] },
    });
    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.tweet_id).toBe(tweetId);
  });

  it("should successfully post a tweet with a video", async () => {
    const text = "My new video!";
    const videoPath = "/path/to/video.mp4";
    const mockMediaId = "1122334455";
    const tweetId = "5544332211";

    mockUploadVideo.mockResolvedValue(mockMediaId);
    mockTweetFn.mockResolvedValue({
      data: {
        id: tweetId,
        text,
      },
    });

    const result = await postTweetTool.execute({ text, video_path: videoPath });

    expect(mockUploadVideo).toHaveBeenCalledWith(mockClient, videoPath);
    expect(mockTweetFn).toHaveBeenCalledWith({
      text,
      media: { media_ids: [mockMediaId] },
    });
    expect(result.isError).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.tweet_id).toBe(tweetId);
  });

  it("should return error when both image and video are provided", async () => {
    const result = await postTweetTool.execute({
      text: "This will fail",
      image_path: "/path/to/image.png",
      video_path: "/path/to/video.mp4",
    });

    expect(result.isError).toBe(true);
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockUploadVideo).not.toHaveBeenCalled();
    expect(mockTweetFn).not.toHaveBeenCalled();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Cannot attach both image and video");
  });

  it("should return error when image upload fails", async () => {
    const imagePath = "/path/to/image.png";
    mockUploadImage.mockRejectedValue(new Error("File not found"));

    const result = await postTweetTool.execute({
      text: "Test with image",
      image_path: imagePath,
    });

    expect(result.isError).toBe(true);
    expect(mockTweetFn).not.toHaveBeenCalled();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to upload image");
    expect(parsed.error).toContain("File not found");
  });

  it("should return error when video upload fails", async () => {
    const videoPath = "/path/to/video.mp4";
    mockUploadVideo.mockRejectedValue(new Error("Video size exceeds limit"));

    const result = await postTweetTool.execute({
      text: "Test with video",
      video_path: videoPath,
    });

    expect(result.isError).toBe(true);
    expect(mockTweetFn).not.toHaveBeenCalled();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Failed to upload video");
    expect(parsed.error).toContain("Video size exceeds limit");
  });
});
