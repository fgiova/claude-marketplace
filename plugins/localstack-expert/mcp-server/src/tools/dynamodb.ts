import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListTablesCommand,
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  type KeySchemaElement,
  type AttributeDefinition,
  type GlobalSecondaryIndex,
  type LocalSecondaryIndex,
} from "@aws-sdk/client-dynamodb";
import {
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { createDynamoDBClient, createDynamoDBDocClient } from "../client-factory.js";
import { textResult, jsonResult, errorResult } from "../utils.js";

const keySchemaSchema = z.array(
  z.object({
    AttributeName: z.string(),
    KeyType: z.enum(["HASH", "RANGE"]),
  }),
);

const attributeDefinitionsSchema = z.array(
  z.object({
    AttributeName: z.string(),
    AttributeType: z.enum(["S", "N", "B"]),
  }),
);

export function registerDynamoDBTools(server: McpServer): void {
  const baseClient = createDynamoDBClient();
  const docClient = createDynamoDBDocClient();

  server.tool(
    "dynamodb_list_tables",
    "List all DynamoDB tables",
    {},
    async () => {
      try {
        const response = await baseClient.send(new ListTablesCommand({}));
        return jsonResult(response.TableNames ?? []);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "dynamodb_describe_table",
    "Get detailed information about a DynamoDB table",
    { tableName: z.string().describe("Table name") },
    async ({ tableName }) => {
      try {
        const response = await baseClient.send(
          new DescribeTableCommand({ TableName: tableName }),
        );
        return jsonResult(response.Table);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "dynamodb_create_table",
    "Create a DynamoDB table",
    {
      tableName: z.string().describe("Table name"),
      keySchema: keySchemaSchema.describe(
        'Key schema: [{AttributeName, KeyType: "HASH"|"RANGE"}]',
      ),
      attributeDefinitions: attributeDefinitionsSchema.describe(
        'Attribute definitions: [{AttributeName, AttributeType: "S"|"N"|"B"}]',
      ),
      billingMode: z
        .enum(["PAY_PER_REQUEST", "PROVISIONED"])
        .optional()
        .default("PAY_PER_REQUEST")
        .describe("Billing mode (default: PAY_PER_REQUEST)"),
      readCapacityUnits: z
        .number()
        .optional()
        .describe("Read capacity units (required if PROVISIONED)"),
      writeCapacityUnits: z
        .number()
        .optional()
        .describe("Write capacity units (required if PROVISIONED)"),
      globalSecondaryIndexes: z
        .array(
          z.object({
            IndexName: z.string(),
            KeySchema: keySchemaSchema,
            Projection: z.object({
              ProjectionType: z.enum(["ALL", "KEYS_ONLY", "INCLUDE"]),
              NonKeyAttributes: z.array(z.string()).optional(),
            }),
          }),
        )
        .optional()
        .describe("Global secondary indexes"),
      localSecondaryIndexes: z
        .array(
          z.object({
            IndexName: z.string(),
            KeySchema: keySchemaSchema,
            Projection: z.object({
              ProjectionType: z.enum(["ALL", "KEYS_ONLY", "INCLUDE"]),
              NonKeyAttributes: z.array(z.string()).optional(),
            }),
          }),
        )
        .optional()
        .describe("Local secondary indexes"),
    },
    async ({
      tableName,
      keySchema,
      attributeDefinitions,
      billingMode,
      readCapacityUnits,
      writeCapacityUnits,
      globalSecondaryIndexes,
      localSecondaryIndexes,
    }) => {
      try {
        const response = await baseClient.send(
          new CreateTableCommand({
            TableName: tableName,
            KeySchema: keySchema as KeySchemaElement[],
            AttributeDefinitions: attributeDefinitions as AttributeDefinition[],
            BillingMode: billingMode,
            ...(billingMode === "PROVISIONED" && {
              ProvisionedThroughput: {
                ReadCapacityUnits: readCapacityUnits ?? 5,
                WriteCapacityUnits: writeCapacityUnits ?? 5,
              },
            }),
            GlobalSecondaryIndexes: globalSecondaryIndexes as GlobalSecondaryIndex[] | undefined,
            LocalSecondaryIndexes: localSecondaryIndexes as LocalSecondaryIndex[] | undefined,
          }),
        );
        return jsonResult({
          tableName: response.TableDescription?.TableName,
          tableArn: response.TableDescription?.TableArn,
          status: response.TableDescription?.TableStatus,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "dynamodb_delete_table",
    "Delete a DynamoDB table",
    { tableName: z.string().describe("Table name") },
    async ({ tableName }) => {
      try {
        await baseClient.send(new DeleteTableCommand({ TableName: tableName }));
        return textResult(`Table "${tableName}" deleted successfully.`);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "dynamodb_put_item",
    "Put an item into a DynamoDB table (uses native JSON — no type descriptors needed)",
    {
      tableName: z.string().describe("Table name"),
      item: z
        .record(z.any())
        .describe('Item as plain JSON (e.g. {"userId": "123", "name": "Alice"})'),
    },
    async ({ tableName, item }) => {
      try {
        await docClient.send(
          new PutCommand({ TableName: tableName, Item: item }),
        );
        return textResult("Item put successfully.");
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "dynamodb_get_item",
    "Get an item from a DynamoDB table by primary key",
    {
      tableName: z.string().describe("Table name"),
      key: z
        .record(z.any())
        .describe('Primary key as plain JSON (e.g. {"userId": "123"})'),
    },
    async ({ tableName, key }) => {
      try {
        const response = await docClient.send(
          new GetCommand({ TableName: tableName, Key: key }),
        );
        if (!response.Item) {
          return textResult("Item not found.");
        }
        return jsonResult(response.Item);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "dynamodb_delete_item",
    "Delete an item from a DynamoDB table by primary key",
    {
      tableName: z.string().describe("Table name"),
      key: z
        .record(z.any())
        .describe('Primary key as plain JSON (e.g. {"userId": "123"})'),
    },
    async ({ tableName, key }) => {
      try {
        await docClient.send(
          new DeleteCommand({ TableName: tableName, Key: key }),
        );
        return textResult("Item deleted successfully.");
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "dynamodb_query",
    "Query items from a DynamoDB table using a key condition expression",
    {
      tableName: z.string().describe("Table name"),
      keyConditionExpression: z
        .string()
        .describe("Key condition expression (e.g. 'userId = :uid')"),
      expressionAttributeValues: z
        .record(z.any())
        .describe('Expression attribute values (e.g. {":uid": "123"})'),
      expressionAttributeNames: z
        .record(z.string())
        .optional()
        .describe('Expression attribute names for reserved words (e.g. {"#s": "status"})'),
      filterExpression: z
        .string()
        .optional()
        .describe("Filter expression applied after query"),
      indexName: z.string().optional().describe("Secondary index name"),
      limit: z.number().optional().describe("Maximum number of items to return"),
      scanIndexForward: z
        .boolean()
        .optional()
        .default(true)
        .describe("Sort order — true for ascending, false for descending"),
    },
    async ({
      tableName,
      keyConditionExpression,
      expressionAttributeValues,
      expressionAttributeNames,
      filterExpression,
      indexName,
      limit,
      scanIndexForward,
    }) => {
      try {
        const response = await docClient.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            FilterExpression: filterExpression,
            IndexName: indexName,
            Limit: limit,
            ScanIndexForward: scanIndexForward,
          }),
        );
        return jsonResult({
          items: response.Items ?? [],
          count: response.Count ?? 0,
          scannedCount: response.ScannedCount ?? 0,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "dynamodb_scan",
    "Scan all items in a DynamoDB table (optionally with a filter)",
    {
      tableName: z.string().describe("Table name"),
      filterExpression: z.string().optional().describe("Filter expression"),
      expressionAttributeValues: z
        .record(z.any())
        .optional()
        .describe("Expression attribute values"),
      expressionAttributeNames: z
        .record(z.string())
        .optional()
        .describe("Expression attribute names for reserved words"),
      indexName: z.string().optional().describe("Secondary index name"),
      limit: z.number().optional().describe("Maximum number of items to return"),
    },
    async ({
      tableName,
      filterExpression,
      expressionAttributeValues,
      expressionAttributeNames,
      indexName,
      limit,
    }) => {
      try {
        const response = await docClient.send(
          new ScanCommand({
            TableName: tableName,
            FilterExpression: filterExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            IndexName: indexName,
            Limit: limit,
          }),
        );
        return jsonResult({
          items: response.Items ?? [],
          count: response.Count ?? 0,
          scannedCount: response.ScannedCount ?? 0,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "dynamodb_update_item",
    "Update an item in a DynamoDB table using an update expression",
    {
      tableName: z.string().describe("Table name"),
      key: z
        .record(z.any())
        .describe('Primary key as plain JSON (e.g. {"userId": "123"})'),
      updateExpression: z
        .string()
        .describe("Update expression (e.g. 'SET #n = :name, age = :age')"),
      expressionAttributeValues: z
        .record(z.any())
        .describe('Expression attribute values (e.g. {":name": "Bob", ":age": 30})'),
      expressionAttributeNames: z
        .record(z.string())
        .optional()
        .describe('Expression attribute names for reserved words (e.g. {"#n": "name"})'),
      conditionExpression: z
        .string()
        .optional()
        .describe("Condition expression for conditional updates"),
    },
    async ({
      tableName,
      key,
      updateExpression,
      expressionAttributeValues,
      expressionAttributeNames,
      conditionExpression,
    }) => {
      try {
        const response = await docClient.send(
          new UpdateCommand({
            TableName: tableName,
            Key: key,
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames,
            ConditionExpression: conditionExpression,
            ReturnValues: "ALL_NEW",
          }),
        );
        return jsonResult(response.Attributes);
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
