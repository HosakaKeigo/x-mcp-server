import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * MCP tool that retweets a specified post on behalf of the authenticated user.
 */
export class RetweetTool implements IMCPTool {
  readonly name = "retweet";

  readonly description = "Retweets a post on behalf of the authenticated user.";

  /** Parameter schema containing the tweet ID to retweet. */
  readonly parameters = {
    tweet_id: z.string().describe("Tweet ID to retweet"),
  } as const;

  /**
   * @param client - Authenticated Twitter API client with read/write scope.
   */
  constructor(private client: TwitterApi) {}

  /**
   * Retweets the given post and returns a confirmation payload. Failures are
   * normalized through createErrorResponse for the MCP client.
   * @param args - Validated arguments including the tweet ID.
   * @returns MCP response describing the retweet result or an error payload.
   */
  async execute(args: InferZodParams<typeof this.parameters>): Promise<{
    content: TextContent[];
    isError?: boolean;
  }> {
    try {
      const { tweet_id } = args;
      const rwClient = this.client.readWrite;
      const me = await rwClient.v2.me();
      await rwClient.v2.retweet(me.data.id, tweet_id);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `Retweeted tweet ${tweet_id}.`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(error, "Failed to retweet");
    }
  }
}
