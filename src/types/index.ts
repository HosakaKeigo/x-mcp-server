import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

/**
 * Utility helper that turns a dictionary of Zod schemas into the corresponding
 * TypeScript argument object shape.
 */
export type InferZodParams<T extends Record<string, z.ZodType>> = {
  [K in keyof T]: z.infer<T[K]>;
};

/**
 * Common contract every MCP tool must follow so it can be registered on an
 * MCP server and invoked by clients.
 */
export interface IMCPTool<
  TParams extends Record<string, z.ZodType> = Record<string, z.ZodType>,
  TOutput extends Record<string, z.ZodType> = Record<string, z.ZodType>
> {
  /** Unique identifier exposed to MCP clients (e.g., `post_tweet`). */
  readonly name: string;

  /** Human-readable summary that clients display in tool pickers. */
  readonly description: string;

  /** Zod schema describing the arguments accepted by the tool. */
  readonly parameters: TParams;

  /**
   * Optional Zod schema describing the structure of the tool's output.
   * When defined, the tool must return structuredContent in the result.
   */
  readonly outputSchema?: TOutput;

  /**
   * Executes the tool logic using validated arguments from the MCP request.
   * @param args - Arguments validated by the Zod schema declared above.
   * @returns MCP-friendly content payload with optional structured content.
   */
  execute(args: InferZodParams<TParams>): Promise<{
    content: TextContent[];
    structuredContent?: Record<string, any>;
    isError?: boolean;
  }>;
}

/**
 * Interface for MCP resources that can return arbitrary content when a client
 * dereferences their URI.
 */
export interface IMCPResource {
  /** Unique resource name announced to the MCP client. */
  readonly name: string;

  /** Fully-qualified URI that the client can request. */
  readonly uri: string;

  /** Handler that resolves content for a given URI. */
  handler(uri: URL): Promise<{
    contents: {
      uri: string;
      text?: string;
      blob?: string;
      mimeType?: string;
    }[];
  }>;
}

/**
 * Interface for custom MCP prompts that can synthesize seed messages based on
 * typed arguments.
 */
export interface IMCPPrompt<TParams extends Record<string, z.ZodType> = Record<string, z.ZodType>> {
  /** Unique prompt identifier. */
  readonly name: string;

  /** Argument schema used to validate prompt inputs. */
  readonly schema: TParams;

  /** Resolver that returns the messages the client should inject. */
  handler(args: InferZodParams<TParams>): {
    messages: {
      role: "user" | "assistant";
      content: TextContent;
    }[];
  };
}
