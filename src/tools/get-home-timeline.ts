import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * ホームタイムライン取得ツール
 */
export class GetHomeTimelineTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "get_home_timeline";

  /**
   * ツールの説明
   */
  readonly description = "ホームタイムラインを取得します";

  /**
   * パラメータ定義
   */
  readonly parameters = {
    count: z.number().optional().describe("取得するツイート数（デフォルト: 10, 最大: 100）"),
  } as const;

  /**
   * コンストラクタ
   * @param client Twitter APIクライアント
   */
  constructor(private client: TwitterApi) {}

  /**
   * ツールを実行
   * @param args パラメータ
   * @returns 実行結果
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
