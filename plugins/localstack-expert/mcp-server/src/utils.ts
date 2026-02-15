import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export function textResult(text: string): CallToolResult {
  return {
    content: [{ type: "text", text }],
  };
}

export function jsonResult(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export function errorResult(error: unknown): CallToolResult {
  let message: string;

  if (error instanceof Error) {
    const awsError = error as Error & {
      name?: string;
      $metadata?: { httpStatusCode?: number };
    };
    const parts: string[] = [];
    if (awsError.name) parts.push(`[${awsError.name}]`);
    parts.push(awsError.message);
    if (awsError.$metadata?.httpStatusCode) {
      parts.push(`(HTTP ${awsError.$metadata.httpStatusCode})`);
    }
    message = parts.join(" ");
  } else {
    message = String(error);
  }

  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}
