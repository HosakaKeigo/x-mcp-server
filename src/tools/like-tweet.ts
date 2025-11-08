import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * MCP tool that likes a specified tweet on behalf of the authenticated user.
 */
export class LikeTweetTool implements IMCPTool {
  readonly name = "like_tweet";

  readonly description = "Likes a tweet on behalf of the authenticated user.";

  readonly dangerous = true;

  /** Parameter schema containing the tweet ID to like. */
  readonly parameters = {
    tweet_id: z.string().describe("Tweet ID to like"),
  } as const;

  /** Zod schema describing the structure of the tool's output. */
  readonly outputSchema = {
    success: z.boolean().describe("Whether the tweet was successfully liked"),
    message: z.string().describe("Confirmation message"),
  } as const;

  /**
   * @param client - Authenticated Twitter API client with read/write scope.
   */
  constructor(private client: TwitterApi) {}

  /**
   * Likes the requested tweet and returns a confirmation payload. Errors are
   * routed through createErrorResponse for consistent MCP responses.
   * @param args - Validated arguments including the tweet ID.
   * @returns MCP response indicating success or failure.
   */
  async execute(args: InferZodParams<typeof this.parameters>): Promise<{
    content: TextContent[];
    structuredContent?: Record<string, any>;
    isError?: boolean;
  }> {
    try {
      const { tweet_id } = args;
      const rwClient = this.client.readWrite;
      const me = await rwClient.v2.me();
      await rwClient.v2.like(me.data.id, tweet_id);

      const result = {
        success: true,
        message: `Liked tweet ${tweet_id}.`,
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
      return createErrorResponse(error, "Failed to like tweet");
    }
  }
}
