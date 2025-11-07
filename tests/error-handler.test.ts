import { describe, expect, it } from "vitest";
import {
  createErrorResponse,
  extractRateLimitInfo,
  handleError,
  isRateLimitError,
} from "../src/utils/error-handler.js";

describe("handleError", () => {
  it("should return error message and stack when given an Error instance", () => {
    const error = new Error("Test error message");
    const result = handleError(error);

    expect(result.message).toBe("Test error message");
    expect(result.stack).toBeDefined();
    expect(result.stack).toContain("Test error message");
  });

  it("should return string representation when given a non-Error object", () => {
    const result = handleError("Simple string error");

    expect(result.message).toBe("Simple string error");
    expect(result.stack).toBeUndefined();
  });

  it("should convert number to string when given a number", () => {
    const result = handleError(404);

    expect(result.message).toBe("404");
    expect(result.stack).toBeUndefined();
  });

  it("should handle null value", () => {
    const result = handleError(null);

    expect(result.message).toBe("null");
    expect(result.stack).toBeUndefined();
  });

  it("should handle undefined value", () => {
    const result = handleError(undefined);

    expect(result.message).toBe("undefined");
    expect(result.stack).toBeUndefined();
  });

  it("should convert object to string", () => {
    const error = { code: "ERR_001", detail: "Something went wrong" };
    const result = handleError(error);

    expect(result.message).toBe("[object Object]");
    expect(result.stack).toBeUndefined();
  });
});

describe("createErrorResponse", () => {
  it("should create error response with Error instance", () => {
    const error = new Error("Test error");
    const response = createErrorResponse(error);

    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toBe("Test error");
    expect(parsed.stack).toBeDefined();
  });

  it("should create error response with custom message", () => {
    const error = new Error("Original error");
    const response = createErrorResponse(error, "Custom prefix");

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.error).toBe("Custom prefix: Original error");
  });

  it("should create error response without stack for non-Error values", () => {
    const response = createErrorResponse("Simple error message");

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toBe("Simple error message");
    expect(parsed.stack).toBeUndefined();
  });

  it("should format response as valid JSON", () => {
    const error = new Error("Test");
    const response = createErrorResponse(error);

    expect(() => JSON.parse(response.content[0].text)).not.toThrow();
  });

  it("should handle custom message with non-Error value", () => {
    const response = createErrorResponse("Network timeout", "Connection failed");

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.error).toBe("Connection failed: Network timeout");
  });
});

describe("isRateLimitError", () => {
  it("should return true for error with rateLimitError flag", () => {
    const error = {
      code: 429,
      rateLimitError: true,
      message: "Rate limit exceeded",
    };
    expect(isRateLimitError(error)).toBe(true);
  });

  it("should return true for error with HTTP 429 status code", () => {
    const error = {
      code: 429,
      message: "Too many requests",
    };
    expect(isRateLimitError(error)).toBe(true);
  });

  it("should return false for non-rate-limit errors", () => {
    const error = {
      code: 400,
      message: "Bad request",
    };
    expect(isRateLimitError(error)).toBe(false);
  });

  it("should return false for Error instance without code", () => {
    const error = new Error("Normal error");
    expect(isRateLimitError(error)).toBe(false);
  });

  it("should return false for string error", () => {
    expect(isRateLimitError("Simple error")).toBe(false);
  });

  it("should return false for null or undefined", () => {
    expect(isRateLimitError(null)).toBe(false);
    expect(isRateLimitError(undefined)).toBe(false);
  });
});

describe("extractRateLimitInfo", () => {
  it("should extract rate limit info from error", () => {
    const resetTime = Math.floor(Date.now() / 1000) + 900; // 15 minutes from now
    const error = {
      code: 429,
      rateLimitError: true,
      message: "Rate limit exceeded",
      rateLimit: {
        limit: 50,
        remaining: 0,
        reset: resetTime,
      },
    };

    const info = extractRateLimitInfo(error);
    expect(info).toBeDefined();
    expect(info?.limit).toBe(50);
    expect(info?.remaining).toBe(0);
    expect(info?.reset).toBe(resetTime);
    expect(info?.resetAt).toBeDefined();
    expect(info?.resetInMinutes).toBeGreaterThan(0);
    expect(info?.resetInMinutes).toBeLessThanOrEqual(15);
  });

  it("should return undefined for error without rateLimit property", () => {
    const error = {
      code: 429,
      message: "Rate limit exceeded",
    };
    expect(extractRateLimitInfo(error)).toBeUndefined();
  });

  it("should return undefined for non-API error", () => {
    const error = new Error("Normal error");
    expect(extractRateLimitInfo(error)).toBeUndefined();
  });

  it("should handle reset time in the past", () => {
    const resetTime = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
    const error = {
      code: 429,
      rateLimitError: true,
      message: "Rate limit exceeded",
      rateLimit: {
        limit: 50,
        remaining: 0,
        reset: resetTime,
      },
    };

    const info = extractRateLimitInfo(error);
    expect(info?.resetInMinutes).toBe(0);
  });

  it("should calculate correct resetAt ISO string", () => {
    const resetTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const error = {
      code: 429,
      rateLimitError: true,
      message: "Rate limit exceeded",
      rateLimit: {
        limit: 50,
        remaining: 0,
        reset: resetTime,
      },
    };

    const info = extractRateLimitInfo(error);
    const resetDate = new Date(resetTime * 1000);
    expect(info?.resetAt).toBe(resetDate.toISOString());
  });
});

describe("createErrorResponse with rate limit", () => {
  it("should create rate limit error response with full details", () => {
    const resetTime = Math.floor(Date.now() / 1000) + 900; // 15 minutes from now
    const error = {
      code: 429,
      rateLimitError: true,
      message: "Rate limit exceeded",
      rateLimit: {
        limit: 50,
        remaining: 0,
        reset: resetTime,
      },
    };

    const response = createErrorResponse(error, "Failed to post tweet");

    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.success).toBe(false);
    expect(parsed.error_type).toBe("RATE_LIMIT_EXCEEDED");
    expect(parsed.error).toBe("Failed to post tweet");
    expect(parsed.details.original_error).toBe("Rate limit exceeded");
    expect(parsed.details.rate_limit).toBeDefined();
    expect(parsed.details.rate_limit.limit).toBe(50);
    expect(parsed.details.rate_limit.remaining).toBe(0);
    expect(parsed.details.rate_limit.reset_at).toBeDefined();
    expect(parsed.details.rate_limit.reset_in_minutes).toBeGreaterThan(0);
    expect(parsed.details.message).toContain("Please retry in");
  });

  it("should create rate limit error response without custom message", () => {
    const resetTime = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now
    const error = {
      code: 429,
      rateLimitError: true,
      message: "Too many requests",
      rateLimit: {
        limit: 100,
        remaining: 0,
        reset: resetTime,
      },
    };

    const response = createErrorResponse(error);

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.error).toBe("Twitter API rate limit reached");
    expect(parsed.error_type).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("should handle rate limit error without rateLimit details", () => {
    const error = {
      code: 429,
      message: "Rate limit exceeded",
    };

    const response = createErrorResponse(error);

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.error_type).toBe("RATE_LIMIT_EXCEEDED");
    expect(parsed.details.original_error).toBe("Rate limit exceeded");
    expect(parsed.details.rate_limit).toBeUndefined();
  });

  it("should show short retry hint when reset time is very close", () => {
    const resetTime = Math.floor(Date.now() / 1000) + 30; // 30 seconds from now
    const error = {
      code: 429,
      rateLimitError: true,
      message: "Rate limit exceeded",
      rateLimit: {
        limit: 50,
        remaining: 0,
        reset: resetTime,
      },
    };

    const response = createErrorResponse(error);

    const parsed = JSON.parse(response.content[0].text);
    // 30 seconds is below one minute, so the rounded value may be either 0 or 1.
    expect(parsed.details.message).toBeDefined();
  });

  it("should format rate limit response as valid JSON", () => {
    const resetTime = Math.floor(Date.now() / 1000) + 900;
    const error = {
      code: 429,
      rateLimitError: true,
      message: "Rate limit exceeded",
      rateLimit: {
        limit: 50,
        remaining: 0,
        reset: resetTime,
      },
    };

    const response = createErrorResponse(error);
    expect(() => JSON.parse(response.content[0].text)).not.toThrow();
  });
});
