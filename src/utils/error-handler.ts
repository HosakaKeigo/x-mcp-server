import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import crypto from "node:crypto";

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
 * Generates a unique error trace ID for correlation between logs and responses.
 * @returns 8-character hexadecimal error ID.
 */
function generateErrorId(): string {
  return crypto.randomBytes(4).toString("hex");
}

/**
 * Logs error details internally without exposing them to the client.
 * @param error - Any thrown error value.
 * @param errorId - Unique identifier for this error instance.
 */
function logErrorDetails(error: unknown, errorId: string): void {
  console.error(`[Error ${errorId}]`, error);
  if (error instanceof Error && error.stack) {
    console.error(`[Stack ${errorId}]`, error.stack);
  }
}

/**
 * Converts unknown errors into a sanitized message that is safe to return
 * to MCP clients without leaking internal implementation details.
 * @param error - Any thrown error value.
 * @returns Plain object with sanitized message and error ID for correlation.
 */
export function handleError(error: unknown): {
  message: string;
  errorId: string;
} {
  const errorId = generateErrorId();
  logErrorDetails(error, errorId);

  let message = "An unexpected error occurred";

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "object" && error !== null && "message" in error) {
    const errorObj = error as { message: unknown };
    if (typeof errorObj.message === "string") {
      message = errorObj.message;
    }
  } else {
    message = String(error);
  }

  return {
    message,
    errorId,
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
  const { message, errorId } = handleError(error);
  const errorMessage = customMessage || "Twitter API rate limit reached";

  const responseData = {
    success: false,
    error_type: "RATE_LIMIT_EXCEEDED" as const,
    error: errorMessage,
    error_id: errorId,
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
            ? `Please retry in ${rateLimitInfo.resetInMinutes} minute(s).`
            : "Rate limit resets momentarily",
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

  const { message, errorId } = handleError(error);
  const errorMessage = customMessage ? `${customMessage}: ${message}` : message;

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            success: false,
            error: errorMessage,
            error_id: errorId,
          },
          null,
          2
        ),
      },
    ],
    isError: true,
  };
}
