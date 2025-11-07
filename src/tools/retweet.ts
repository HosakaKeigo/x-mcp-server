import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * リツイートツール
 */
export class RetweetTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "retweet";

  /**
   * ツールの説明
   */
  readonly description = "ツイートをリツイートします";

  /**
   * パラメータ定義
   */
  readonly parameters = {
    tweet_id: z.string().describe("リツイートするツイートのID"),
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
                message: `ツイート ${tweet_id} をリツイートしました`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(error, "リツイートに失敗しました");
    }
  }
}
