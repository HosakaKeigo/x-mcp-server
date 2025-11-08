import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * MCP tool that searches recent tweets using the standard v2 search endpoint.
 */
export class SearchTweetsTool implements IMCPTool {
  readonly name = "search_tweets";

  readonly description = "Searches recent tweets by keyword.";

  /** Parameter schema containing the search query and optional result count. */
  readonly parameters = {
    query: z.string().describe("Search query"),
    count: z.number().int().min(1).max(100).optional().describe("Number of tweets to fetch (default 10, max 100)"),
  } as const;

  /** Zod schema describing the structure of the tool's output. */
  readonly outputSchema = {
    success: z.boolean().describe("Whether the search was successful"),
    query: z.string().describe("Search query that was executed"),
    count: z.number().describe("Number of tweets found"),
    tweets: z
      .array(
        z.object({
          id: z.string().describe("Tweet ID"),
          text: z.string().describe("Tweet text content"),
          created_at: z.string().optional().describe("Tweet creation timestamp"),
        })
      )
      .describe("Array of matching tweets"),
  } as const;

  /**
   * @param client - Authenticated Twitter API client with read/write scope.
   */
  constructor(private client: TwitterApi) {}

  /**
   * Executes the recent search endpoint and returns normalized tweet data to
   * the MCP client.
   * @param args - Validated arguments that include the search query.
   * @returns MCP response payload describing the search results or an error.
   */
  async execute(args: InferZodParams<typeof this.parameters>): Promise<{
    content: TextContent[];
    structuredContent?: Record<string, any>;
    isError?: boolean;
  }> {
    try {
      const { query, count = 10 } = args;
      const rwClient = this.client.readWrite;
      const searchResults = await rwClient.v2.search(query, {
        max_results: Math.min(count, 100),
      });

      const result = {
        success: true,
        query,
        count: searchResults.data.data?.length || 0,
        tweets:
          searchResults.data.data?.map((t) => ({
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
      return createErrorResponse(error, "Failed to search tweets");
    }
  }
}
