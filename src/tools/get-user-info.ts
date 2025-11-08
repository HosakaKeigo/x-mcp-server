import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * MCP tool that fetches public profile information for a specified username.
 */
export class GetUserInfoTool implements IMCPTool {
  readonly name = "get_user_info";

  readonly description = "Retrieves basic profile information for a given user.";

  /** Parameter schema containing the username to resolve. */
  readonly parameters = {
    username: z.string().regex(/^[A-Za-z0-9_]{1,15}$/, "Username must be 1-15 characters (letters, numbers, underscore only)").describe("Username (without @)"),
  } as const;

  /** Zod schema describing the structure of the tool's output. */
  readonly outputSchema = {
    success: z.boolean().describe("Whether the user info was successfully fetched"),
    user: z
      .object({
        id: z.string().describe("User ID"),
        username: z.string().describe("Username"),
        name: z.string().describe("Display name"),
        description: z.string().optional().describe("User bio/description"),
        created_at: z.string().optional().describe("Account creation timestamp"),
        verified: z.boolean().optional().describe("Verification status"),
        location: z.string().optional().describe("User location"),
        metrics: z
          .object({
            followers_count: z.number().describe("Number of followers"),
            following_count: z.number().describe("Number of accounts following"),
            tweet_count: z.number().describe("Total number of tweets"),
            listed_count: z.number().describe("Number of lists the user is a member of"),
          })
          .optional()
          .describe("Public metrics for the user"),
      })
      .describe("User profile information"),
  } as const;

  /**
   * @param client - Authenticated Twitter API client with read/write scope.
   */
  constructor(private client: TwitterApi) {}

  /**
   * Retrieves the user's profile fields and returns them to the MCP client.
   * @param args - Validated arguments containing the username.
   * @returns MCP response content with the user payload or an error message.
   */
  async execute(args: InferZodParams<typeof this.parameters>): Promise<{
    content: TextContent[];
    structuredContent?: Record<string, any>;
    isError?: boolean;
  }> {
    try {
      const { username } = args;
      const rwClient = this.client.readWrite;
      const user = await rwClient.v2.userByUsername(username, {
        "user.fields": ["created_at", "description", "public_metrics", "verified", "location"],
      });

      if (!user.data) {
        throw new Error(`User @${username} was not found`);
      }

      const result = {
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
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent: result,
      };
    } catch (error) {
      return createErrorResponse(error, "Failed to fetch user info");
    }
  }
}
