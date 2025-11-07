import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * ユーザーツイート取得ツール
 */
export class GetUserTweetsTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "get_user_tweets";

  /**
   * ツールの説明
   */
  readonly description = "指定したユーザーの最新ツイートを取得します";

  /**
   * パラメータ定義
   */
  readonly parameters = {
    username: z.string().describe("ユーザー名（@なし）"),
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
      const { username, count = 10 } = args;
      const rwClient = this.client.readWrite;
      const user = await rwClient.v2.userByUsername(username);

      if (!user.data) {
        throw new Error(`ユーザー @${username} が見つかりません`);
      }

      const tweets = await rwClient.v2.userTimeline(user.data.id, {
        max_results: Math.min(count, 100),
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                username,
                count: tweets.data.data?.length || 0,
                tweets:
                  tweets.data.data?.map((t) => ({
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
      return createErrorResponse(error, "ユーザーツイートの取得に失敗しました");
    }
  }
}
