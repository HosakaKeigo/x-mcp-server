import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Environment variables validation schema using t3-env.
 * This provides type-safe access to environment variables with runtime validation.
 *
 * @see https://env.t3.gg/docs/core
 */
export const env = createEnv({
  /**
   * Prefix for client-side environment variables.
   * Since this is a server-only MCP server, we don't use client-side variables.
   */
  clientPrefix: "",

  /**
   * Server-side environment variables schema.
   * These are validated at runtime and must be set.
   */
  server: {
    // X (Twitter) API Credentials
    X_API_KEY: z
      .string()
      .trim()
      .min(1, "X_API_KEY is required")
      .describe("API Key (Consumer Key) from X Developer Portal"),

    X_API_SECRET: z
      .string()
      .trim()
      .min(1, "X_API_SECRET is required")
      .describe("API Secret (Consumer Secret) from X Developer Portal"),

    X_ACCESS_TOKEN: z
      .string()
      .trim()
      .min(1, "X_ACCESS_TOKEN is required")
      .describe("Access Token from X Developer Portal"),

    X_ACCESS_TOKEN_SECRET: z
      .string()
      .trim()
      .min(1, "X_ACCESS_TOKEN_SECRET is required")
      .describe("Access Token Secret from X Developer Portal"),

    // Node environment
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development")
      .describe("Node environment"),
  },

  /**
   * Client-side environment variables schema.
   * These must be prefixed with a public prefix (e.g., VITE_, NEXT_PUBLIC_).
   * This MCP server doesn't use client-side variables.
   */
  client: {},

  /**
   * Runtime environment variables.
   * This is where you destructure all your environment variables.
   */
  runtimeEnv: process.env,

  /**
   * Skip validation in certain environments.
   * Only recommended during build time for edge runtimes.
   */
  skipValidation: false,

  /**
   * Extend the default Error class to provide better error messages.
   */
  emptyStringAsUndefined: true,
});