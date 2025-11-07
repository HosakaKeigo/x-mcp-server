import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * ツイート検索ツール
 */
export class SearchTweetsTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "search_tweets";

  /**
   * ツールの説明
   */
  readonly description = "キーワードでツイートを検索します";

  /**
   * パラメータ定義
   */
  readonly parameters = {
    query: z.string().describe("検索クエリ"),
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
      return createErrorResponse(error, "ツイート検索に失敗しました");
    }
  }
}
