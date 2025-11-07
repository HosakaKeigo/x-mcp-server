import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * ツイート投稿ツール
 */
export class PostTweetTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "post_tweet";

  /**
   * ツールの説明
   */
  readonly description = "ツイート（ポスト）を投稿します";

  /**
   * パラメータ定義
   */
  readonly parameters = {
    text: z.string().describe("投稿するツイートのテキスト（最大280文字）"),
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
      const { text } = args;
      const rwClient = this.client.readWrite;
      const tweet = await rwClient.v2.tweet(text);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                tweet_id: tweet.data.id,
                text: tweet.data.text,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(error, "ツイートの投稿に失敗しました");
    }
  }
}
