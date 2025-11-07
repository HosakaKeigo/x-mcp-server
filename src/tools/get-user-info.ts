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
    username: z.string().describe("Username (without @)"),
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
      return createErrorResponse(error, "Failed to fetch user info");
    }
  }
}
