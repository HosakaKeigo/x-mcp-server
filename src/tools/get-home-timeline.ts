import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * MCP tool that retrieves the authenticated user's home timeline.
 */
export class GetHomeTimelineTool implements IMCPTool {
  readonly name = "get_home_timeline";

  readonly description = "Retrieves the authenticated user's home timeline.";

  /** Parameter schema controlling how many tweets are returned. */
  readonly parameters = {
    count: z.number().int().min(1).max(100).optional().describe("Number of tweets to fetch (default 10, max 100)"),
  } as const;

  /** Zod schema describing the structure of the tool's output. */
  readonly outputSchema = {
    success: z.boolean().describe("Whether the timeline was successfully fetched"),
    count: z.number().describe("Number of tweets returned"),
    tweets: z
      .array(
        z.object({
          id: z.string().describe("Tweet ID"),
          text: z.string().describe("Tweet text content"),
          created_at: z.string().optional().describe("Tweet creation timestamp"),
        })
      )
      .describe("Array of timeline tweets"),
  } as const;

  /**
   * @param client - Authenticated Twitter API client with read/write scope.
   */
  constructor(private client: TwitterApi) {}

  /**
   * Fetches the home timeline via twitter-api-v2 and returns a summarized list
   * of tweets. Rate-limit or API errors are converted into MCP error payloads.
   * @param args - Validated arguments supplied by the MCP client.
   * @returns MCP response content describing the timeline or an error payload.
   */
  async execute(args: InferZodParams<typeof this.parameters>): Promise<{
    content: TextContent[];
    structuredContent?: Record<string, any>;
    isError?: boolean;
  }> {
    try {
      const { count = 10 } = args;
      const rwClient = this.client.readWrite;
      const timeline = await rwClient.v2.homeTimeline({
        max_results: Math.min(count, 100),
      });
      const tweets = timeline.data.data || [];

      const result = {
        success: true,
        count: tweets.length,
        tweets: tweets.map((t) => ({
          id: t.id,
          text: t.text,
          created_at: t.created_at,
        })),
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
      return createErrorResponse(error, "Failed to fetch home timeline");
    }
  }
}
