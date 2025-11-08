import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";
import { uploadImage, uploadVideo } from "../utils/media-upload.js";

/**
 * MCP tool that publishes a new post on behalf of the authenticated user.
 */
export class PostTweetTool implements IMCPTool {
  readonly name = "post_tweet";

  readonly description = "Posts a tweet on behalf of the authenticated user.";

  readonly dangerous = true;

  /** Zod schema describing the tweet body supplied by the MCP client. */
  readonly parameters = {
    text: z.string().trim().min(1, "Tweet text cannot be empty").max(280, "Tweet text cannot exceed 280 characters").describe("Tweet text to publish (1-280 characters)"),
    image_path: z.string().optional().describe("Optional absolute path to an image file to attach (PNG, JPEG, GIF, WEBP, max 5MB)"),
    video_path: z.string().optional().describe("Optional absolute path to a video file to attach (MP4, MOV, AVI, WEBM, M4V, max 512MB). Cannot be used with image_path."),
  } as const;

  /** Zod schema describing the structure of the tool's output. */
  readonly outputSchema = {
    success: z.boolean().describe("Whether the tweet was successfully posted"),
    tweet_id: z.string().describe("The ID of the posted tweet"),
    text: z.string().describe("The text content of the posted tweet"),
  } as const;

  /**
   * @param client - Authenticated Twitter API client with read/write access.
   */
  constructor(private client: TwitterApi) {}

  /**
   * Sends the tweet through twitter-api-v2 and returns the created tweet
   * metadata to the MCP client. Errors are normalized via createErrorResponse.
   * @param args - Validated arguments provided by the MCP request.
   * @returns MCP-compatible response content (or error payload).
   */
  async execute(args: InferZodParams<typeof this.parameters>): Promise<{
    content: TextContent[];
    structuredContent?: Record<string, any>;
    isError?: boolean;
  }> {
    try {
      const { text, image_path, video_path } = args;

      // Validate that both image and video aren't provided
      if (image_path && video_path) {
        throw new Error(
          "Cannot attach both image and video to the same tweet. Please provide only one.",
        );
      }

      let mediaId: string | undefined;

      // Upload media if image_path is provided
      if (image_path) {
        try {
          mediaId = await uploadImage(this.client, image_path);
        } catch (error) {
          throw new Error(
            `Failed to upload image: ${(error as Error).message}`,
          );
        }
      }

      // Upload video if video_path is provided
      if (video_path) {
        try {
          mediaId = await uploadVideo(this.client, video_path);
        } catch (error) {
          throw new Error(
            `Failed to upload video: ${(error as Error).message}`,
          );
        }
      }

      const rwClient = this.client.readWrite;
      const tweet = mediaId
        ? await rwClient.v2.tweet({ text, media: { media_ids: [mediaId] } })
        : await rwClient.v2.tweet(text);

      const result = {
        success: true,
        tweet_id: tweet.data.id,
        text: tweet.data.text,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent: result,
      };
    } catch (error) {
      return createErrorResponse(error, "Failed to post tweet");
    }
  }
}
