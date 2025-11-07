import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * MCP tool that publishes a new post on behalf of the authenticated user.
 */
export class PostTweetTool implements IMCPTool {
  readonly name = "post_tweet";

  readonly description = "ツイート（ポスト）を投稿します";

  /** Zod schema describing the tweet body supplied by the MCP client. */
  readonly parameters = {
    text: z.string().describe("投稿するツイートのテキスト（最大280文字）"),
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
    isError?: boolean;
  }> {
    try {
      const { text } = args;
      const rwClient = this.client.readWrite;
      const tweet = await rwClient.v2.tweet(text);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                tweet_id: tweet.data.id,
                text: tweet.data.text,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(error, "ツイートの投稿に失敗しました");
    }
  }
}
