import fs from "node:fs";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListFunctionsCommand,
  CreateFunctionCommand,
  DeleteFunctionCommand,
  InvokeCommand,
  GetFunctionCommand,
  UpdateFunctionCodeCommand,
  ListEventSourceMappingsCommand,
  CreateEventSourceMappingCommand,
  type Runtime,
} from "@aws-sdk/client-lambda";
import { createLambdaClient } from "../client-factory.js";
import { textResult, jsonResult, errorResult } from "../utils.js";

export function registerLambdaTools(server: McpServer): void {
  const client = createLambdaClient();

  server.tool(
    "lambda_list_functions",
    "List all Lambda functions",
    {},
    async () => {
      try {
        const response = await client.send(new ListFunctionsCommand({}));
        return jsonResult(response.Functions ?? []);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "lambda_create_function",
    "Create a Lambda function from a zip file",
    {
      functionName: z.string().describe("Function name"),
      runtime: z.string().describe("Runtime (e.g. nodejs20.x, python3.12)"),
      handler: z.string().describe("Handler (e.g. index.handler)"),
      zipFilePath: z
        .string()
        .describe("Absolute path to the zip file containing the function code"),
      role: z
        .string()
        .optional()
        .default("arn:aws:iam::000000000000:role/lambda-role")
        .describe("IAM role ARN"),
      environment: z
        .record(z.string())
        .optional()
        .describe("Environment variables"),
      timeout: z.number().optional().describe("Timeout in seconds"),
      memorySize: z.number().optional().describe("Memory size in MB"),
    },
    async ({
      functionName,
      runtime,
      handler,
      zipFilePath,
      role,
      environment,
      timeout,
      memorySize,
    }) => {
      try {
        const zipBuffer = fs.readFileSync(zipFilePath);
        const response = await client.send(
          new CreateFunctionCommand({
            FunctionName: functionName,
            Runtime: runtime as Runtime,
            Handler: handler,
            Code: { ZipFile: zipBuffer },
            Role: role,
            Environment: environment ? { Variables: environment } : undefined,
            Timeout: timeout,
            MemorySize: memorySize,
          }),
        );
        return jsonResult({
          functionName: response.FunctionName,
          functionArn: response.FunctionArn,
          runtime: response.Runtime,
          state: response.State,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "lambda_delete_function",
    "Delete a Lambda function",
    { functionName: z.string().describe("Function name") },
    async ({ functionName }) => {
      try {
        await client.send(
          new DeleteFunctionCommand({ FunctionName: functionName }),
        );
        return textResult(
          `Function "${functionName}" deleted successfully.`,
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "lambda_invoke",
    "Invoke a Lambda function",
    {
      functionName: z.string().describe("Function name"),
      payload: z.string().optional().describe("JSON payload"),
      invocationType: z
        .enum(["RequestResponse", "Event", "DryRun"])
        .optional()
        .default("RequestResponse")
        .describe("Invocation type (default: RequestResponse)"),
    },
    async ({ functionName, payload, invocationType }) => {
      try {
        const response = await client.send(
          new InvokeCommand({
            FunctionName: functionName,
            Payload: payload ? new TextEncoder().encode(payload) : undefined,
            InvocationType: invocationType,
          }),
        );
        const responsePayload = response.Payload
          ? new TextDecoder().decode(response.Payload)
          : null;
        return jsonResult({
          statusCode: response.StatusCode,
          functionError: response.FunctionError,
          payload: responsePayload,
          executedVersion: response.ExecutedVersion,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "lambda_get_function",
    "Get details of a Lambda function",
    { functionName: z.string().describe("Function name") },
    async ({ functionName }) => {
      try {
        const response = await client.send(
          new GetFunctionCommand({ FunctionName: functionName }),
        );
        return jsonResult({
          configuration: response.Configuration,
          code: response.Code,
          tags: response.Tags,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "lambda_update_function_code",
    "Update a Lambda function's code from a zip file",
    {
      functionName: z.string().describe("Function name"),
      zipFilePath: z
        .string()
        .describe("Absolute path to the zip file containing the updated code"),
    },
    async ({ functionName, zipFilePath }) => {
      try {
        const zipBuffer = fs.readFileSync(zipFilePath);
        const response = await client.send(
          new UpdateFunctionCodeCommand({
            FunctionName: functionName,
            ZipFile: zipBuffer,
          }),
        );
        return jsonResult({
          functionName: response.FunctionName,
          functionArn: response.FunctionArn,
          lastModified: response.LastModified,
          state: response.State,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "lambda_list_event_source_mappings",
    "List event source mappings for Lambda functions",
    {
      functionName: z
        .string()
        .optional()
        .describe("Function name to filter by"),
      eventSourceArn: z
        .string()
        .optional()
        .describe("Event source ARN to filter by"),
    },
    async ({ functionName, eventSourceArn }) => {
      try {
        const response = await client.send(
          new ListEventSourceMappingsCommand({
            FunctionName: functionName,
            EventSourceArn: eventSourceArn,
          }),
        );
        return jsonResult(response.EventSourceMappings ?? []);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "lambda_create_event_source_mapping",
    "Create an event source mapping for a Lambda function",
    {
      functionName: z.string().describe("Function name"),
      eventSourceArn: z
        .string()
        .describe("Event source ARN (e.g. SQS queue ARN, Kinesis stream ARN)"),
      batchSize: z
        .number()
        .optional()
        .default(10)
        .describe("Batch size (default 10)"),
      enabled: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether the mapping is enabled (default true)"),
    },
    async ({ functionName, eventSourceArn, batchSize, enabled }) => {
      try {
        const response = await client.send(
          new CreateEventSourceMappingCommand({
            FunctionName: functionName,
            EventSourceArn: eventSourceArn,
            BatchSize: batchSize,
            Enabled: enabled,
          }),
        );
        return jsonResult({
          uuid: response.UUID,
          functionArn: response.FunctionArn,
          eventSourceArn: response.EventSourceArn,
          state: response.State,
          batchSize: response.BatchSize,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
