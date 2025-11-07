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

  readonly description = "ホームタイムラインを取得します";

  /** Parameter schema controlling how many tweets are returned. */
  readonly parameters = {
    count: z.number().optional().describe("取得するツイート数（デフォルト: 10, 最大: 100）"),
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
    isError?: boolean;
  }> {
    try {
      const { count = 10 } = args;
      const rwClient = this.client.readWrite;
      const timeline = await rwClient.v2.homeTimeline({
        max_results: Math.min(count, 100),
      });
      const tweets = timeline.data.data || [];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                count: tweets.length,
                tweets: tweets.map((t) => ({
                  id: t.id,
                  text: t.text,
                  created_at: t.created_at,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(error, "ホームタイムラインの取得に失敗しました");
    }
  }
}
