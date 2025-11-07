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
    count: z.number().optional().describe("Number of tweets to fetch (default 10, max 100)"),
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
    isError?: boolean;
  }> {
    try {
      const { query, count = 10 } = args;
      const rwClient = this.client.readWrite;
      const searchResults = await rwClient.v2.search(query, {
        max_results: Math.min(count, 100),
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                query,
                count: searchResults.data.data?.length || 0,
                tweets:
                  searchResults.data.data?.map((t) => ({
                    id: t.id,
                    text: t.text,
                    created_at: t.created_at,
                  })) || [],
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(error, "Failed to search tweets");
    }
  }
}
