import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * ユーザー情報取得ツール
 */
export class GetUserInfoTool implements IMCPTool {
  /**
   * ツール名
   */
  readonly name = "get_user_info";

  /**
   * ツールの説明
   */
  readonly description = "指定したユーザーの情報を取得します";

  /**
   * パラメータ定義
   */
  readonly parameters = {
    username: z.string().describe("ユーザー名（@なし）"),
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
      const { username } = args;
      const rwClient = this.client.readWrite;
      const user = await rwClient.v2.userByUsername(username, {
        "user.fields": ["created_at", "description", "public_metrics", "verified", "location"],
      });

      if (!user.data) {
        throw new Error(`ユーザー @${username} が見つかりません`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                user: {
                  id: user.data.id,
                  username: user.data.username,
                  name: user.data.name,
                  description: user.data.description,
                  created_at: user.data.created_at,
                  verified: user.data.verified,
                  location: user.data.location,
                  metrics: user.data.public_metrics,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(error, "ユーザー情報の取得に失敗しました");
    }
  }
}
