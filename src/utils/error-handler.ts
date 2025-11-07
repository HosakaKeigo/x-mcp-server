import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

/**
 * エラーをハンドリングして標準化されたメッセージを返す
 * @param error エラーオブジェクト
 * @returns エラーメッセージとスタックトレース
 */
export function handleError(error: unknown): {
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: String(error),
  };
}

/**
 * エラーレスポンスを作成する
 * @param error エラーオブジェクト
 * @param customMessage カスタムエラーメッセージ
 * @returns MCPエラーレスポンス
 */
export function createErrorResponse(
  error: unknown,
  customMessage?: string
): {
  content: TextContent[];
  isError: boolean;
} {
  const { message, stack } = handleError(error);
  const errorMessage = customMessage ? `${customMessage}: ${message}` : message;

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            success: false,
            error: errorMessage,
            ...(stack && { stack }),
          },
          null,
          2
        ),
      },
    ],
    isError: true,
  };
}
