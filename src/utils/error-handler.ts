import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

/**
 * Rate limit情報の型定義
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  resetAt: string;
  resetInMinutes: number;
}

/**
 * Twitter APIのエラーかどうかを判定
 */
function isTwitterApiError(error: unknown): error is {
  code: number;
  rateLimitError?: boolean;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
  message: string;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "number"
  );
}

/**
 * Rate limitエラーかどうかを判定
 * @param error エラーオブジェクト
 * @returns rate limitエラーの場合はtrue
 */
export function isRateLimitError(error: unknown): boolean {
  if (!isTwitterApiError(error)) {
    return false;
  }

  // ApiResponseError.rateLimitErrorプロパティをチェック
  if ("rateLimitError" in error && error.rateLimitError === true) {
    return true;
  }

  // HTTPステータスコード429をチェック
  if (error.code === 429) {
    return true;
  }

  return false;
}

/**
 * Rate limit情報を抽出
 * @param error エラーオブジェクト
 * @returns rate limit情報（存在しない場合はundefined）
 */
export function extractRateLimitInfo(error: unknown): RateLimitInfo | undefined {
  if (!isTwitterApiError(error) || !error.rateLimit) {
    return undefined;
  }

  const { limit, remaining, reset } = error.rateLimit;
  const resetDate = new Date(reset * 1000);
  const now = new Date();
  const resetInMinutes = Math.ceil((resetDate.getTime() - now.getTime()) / 1000 / 60);

  return {
    limit,
    remaining,
    reset,
    resetAt: resetDate.toISOString(),
    resetInMinutes: Math.max(0, resetInMinutes),
  };
}

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

  // オブジェクトの場合、messageプロパティがあればそれを使う
  if (typeof error === "object" && error !== null && "message" in error) {
    const errorObj = error as { message: unknown };
    if (typeof errorObj.message === "string") {
      return {
        message: errorObj.message,
      };
    }
  }

  return {
    message: String(error),
  };
}

/**
 * Rate limit専用のエラーレスポンスを作成する
 * @param error エラーオブジェクト
 * @param customMessage カスタムエラーメッセージ
 * @returns MCPエラーレスポンス
 */
function createRateLimitErrorResponse(
  error: unknown,
  customMessage?: string
): {
  content: TextContent[];
  isError: boolean;
} {
  const rateLimitInfo = extractRateLimitInfo(error);
  const { message } = handleError(error);
  const errorMessage = customMessage || "Twitter APIのレート制限に達しました";

  const responseData = {
    success: false,
    error_type: "RATE_LIMIT_EXCEEDED" as const,
    error: errorMessage,
    details: {
      original_error: message,
      ...(rateLimitInfo && {
        rate_limit: {
          limit: rateLimitInfo.limit,
          remaining: rateLimitInfo.remaining,
          reset_at: rateLimitInfo.resetAt,
          reset_in_minutes: rateLimitInfo.resetInMinutes,
        },
        message:
          rateLimitInfo.resetInMinutes > 0
            ? `${rateLimitInfo.resetInMinutes}分後に再試行してください`
            : "まもなくリセットされます",
      }),
    },
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(responseData, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * エラーレスポンスを作成する
 * Rate limitエラーの場合は専用のレスポンスを返す
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
  // Rate limitエラーの場合は専用のレスポンスを返す
  if (isRateLimitError(error)) {
    return createRateLimitErrorResponse(error, customMessage);
  }

  // 通常のエラーレスポンス
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
