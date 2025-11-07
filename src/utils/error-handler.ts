import type { TextContent } from "@modelcontextprotocol/sdk/types.js";

/**
 * Normalized representation of the rate-limit metadata returned by the
 * twitter-api-v2 client.
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  resetAt: string;
  resetInMinutes: number;
}

/**
 * Type guard that checks whether the thrown error matches the shape provided
 * by twitter-api-v2.
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
 * Determines whether the provided error represents a rate-limit violation.
 * @param error - Unknown error thrown during a Twitter API call.
 * @returns True if the error signals a rate-limit issue (429 or explicit flag).
 */
export function isRateLimitError(error: unknown): boolean {
  if (!isTwitterApiError(error)) {
    return false;
  }

  // Check the ApiResponseError.rateLimitError helper added by twitter-api-v2.
  if ("rateLimitError" in error && error.rateLimitError === true) {
    return true;
  }

  // Fallback to plain HTTP status code comparison.
  if (error.code === 429) {
    return true;
  }

  return false;
}

/**
 * Extracts rate-limit details from a twitter-api-v2 error, if present.
 * @param error - Unknown error thrown during a Twitter API call.
 * @returns Parsed rate-limit metadata or undefined when unavailable.
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
 * Converts unknown errors into a normalized message/stack pair so that MCP
 * responses remain predictable.
 * @param error - Any thrown error value.
 * @returns Plain object describing the message and optional stack trace.
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

  // Prefer a message field when the thrown value is an arbitrary object.
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
 * Builds a structured MCP error response for rate-limit violations so the
 * client can display actionable metadata.
 * @param error - Original twitter-api-v2 error value.
 * @param customMessage - Optional user-friendly override message.
 * @returns Serialized MCP error payload with rate-limit details embedded.
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
 * Creates a standardized MCP error response, delegating to the specialized
 * rate-limit handler when appropriate.
 * @param error - Unknown error captured in a tool.
 * @param customMessage - Optional prefix that gives more task-specific context.
 * @returns Serialized MCP error payload consumable by MCP clients.
 */
export function createErrorResponse(
  error: unknown,
  customMessage?: string
): {
  content: TextContent[];
  isError: boolean;
} {
  if (isRateLimitError(error)) {
    return createRateLimitErrorResponse(error, customMessage);
  }

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
