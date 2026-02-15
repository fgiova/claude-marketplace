import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  registerS3Tools,
  registerSqsTools,
  registerSnsTools,
  registerLambdaTools,
  registerDynamoDBTools,
} from "./tools/index.js";

const server = new McpServer({ name: "localstack", version: "0.1.0" });

registerS3Tools(server);
registerSqsTools(server);
registerSnsTools(server);
registerLambdaTools(server);
registerDynamoDBTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("LocalStack MCP Server running on stdio");
