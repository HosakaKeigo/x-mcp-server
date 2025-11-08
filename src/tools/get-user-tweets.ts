import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * MCP tool that fetches the latest tweets for a given username.
 */
export class GetUserTweetsTool implements IMCPTool {
  readonly name = "get_user_tweets";

  readonly description = "Retrieves recent tweets for a specific user.";

  /** Parameter schema capturing the username and optional result count. */
  readonly parameters = {
    username: z.string().describe("Username (without @)"),
    count: z.number().optional().describe("Number of tweets to fetch (default 10, max 100)"),
  } as const;

  /** Zod schema describing the structure of the tool's output. */
  readonly outputSchema = {
    success: z.boolean().describe("Whether the user tweets were successfully fetched"),
    username: z.string().describe("Username that was queried"),
    count: z.number().describe("Number of tweets returned"),
    tweets: z.array(z.object({
      id: z.string().describe("Tweet ID"),
      text: z.string().describe("Tweet text content"),
      created_at: z.string().optional().describe("Tweet creation timestamp"),
    })).describe("Array of user tweets"),
  } as const;

  /**
   * @param client - Authenticated Twitter API client with read/write scope.
   */
  constructor(private client: TwitterApi) {}

  /**
   * Resolves the user ID, fetches their timeline, and returns normalized tweet
   * data to the MCP client.
   * @param args - Validated arguments including username and count.
   * @returns MCP response content summarizing the tweets or an error payload.
   */
  async execute(args: InferZodParams<typeof this.parameters>): Promise<{
    content: TextContent[];
    structuredContent?: Record<string, any>;
    isError?: boolean;
  }> {
    try {
      const { username, count = 10 } = args;
      const rwClient = this.client.readWrite;
      const user = await rwClient.v2.userByUsername(username);

      if (!user.data) {
        throw new Error(`User @${username} was not found`);
      }

      const tweets = await rwClient.v2.userTimeline(user.data.id, {
        max_results: Math.min(count, 100),
      });

      const result = {
        success: true,
        username,
        count: tweets.data.data?.length || 0,
        tweets:
          tweets.data.data?.map((t) => ({
            id: t.id,
            text: t.text,
            created_at: t.created_at,
          })) || [],
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
      return createErrorResponse(error, "Failed to fetch user tweets");
    }
  }
}
