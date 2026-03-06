import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListQueuesCommand,
  CreateQueueCommand,
  DeleteQueueCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  PurgeQueueCommand,
  GetQueueAttributesCommand,
} from "@aws-sdk/client-sqs";
import { createSQSClient } from "../client-factory.js";
import { textResult, jsonResult, errorResult } from "../utils.js";

export function registerSqsTools(server: McpServer): void {
  const client = createSQSClient();

  server.tool(
    "sqs_list_queues",
    "List SQS queues",
    {
      prefix: z.string().optional().describe("Queue name prefix filter"),
    },
    async ({ prefix }) => {
      try {
        const response = await client.send(
          new ListQueuesCommand({
            QueueNamePrefix: prefix,
          }),
        );
        return jsonResult(response.QueueUrls ?? []);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "sqs_create_queue",
    "Create an SQS queue",
    {
      queueName: z.string().describe("Queue name"),
      attributes: z
        .record(z.string())
        .optional()
        .describe(
          "Queue attributes (e.g. FifoQueue, ContentBasedDeduplication)",
        ),
    },
    async ({ queueName, attributes }) => {
      try {
        const response = await client.send(
          new CreateQueueCommand({
            QueueName: queueName,
            Attributes: attributes,
          }),
        );
        return jsonResult({ queueUrl: response.QueueUrl });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "sqs_delete_queue",
    "Delete an SQS queue",
    { queueUrl: z.string().describe("Queue URL") },
    async ({ queueUrl }) => {
      try {
        await client.send(new DeleteQueueCommand({ QueueUrl: queueUrl }));
        return textResult(`Queue deleted successfully.`);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "sqs_send_message",
    "Send a message to an SQS queue",
    {
      queueUrl: z.string().describe("Queue URL"),
      messageBody: z.string().describe("Message body"),
      messageGroupId: z
        .string()
        .optional()
        .describe("Message group ID (required for FIFO queues)"),
      messageDeduplicationId: z
        .string()
        .optional()
        .describe("Message deduplication ID (for FIFO queues)"),
    },
    async ({ queueUrl, messageBody, messageGroupId, messageDeduplicationId }) => {
      try {
        const response = await client.send(
          new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: messageBody,
            MessageGroupId: messageGroupId,
            MessageDeduplicationId: messageDeduplicationId,
          }),
        );
        return jsonResult({
          messageId: response.MessageId,
          md5: response.MD5OfMessageBody,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "sqs_receive_messages",
    "Receive messages from an SQS queue",
    {
      queueUrl: z.string().describe("Queue URL"),
      maxMessages: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .default(1)
        .describe("Max messages to receive (1-10, default 1)"),
      waitTimeSeconds: z
        .number()
        .optional()
        .default(0)
        .describe("Long poll wait time in seconds (default 0)"),
    },
    async ({ queueUrl, maxMessages, waitTimeSeconds }) => {
      try {
        const response = await client.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: maxMessages,
            WaitTimeSeconds: waitTimeSeconds,
          }),
        );
        return jsonResult(response.Messages ?? []);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "sqs_delete_message",
    "Delete a message from an SQS queue",
    {
      queueUrl: z.string().describe("Queue URL"),
      receiptHandle: z.string().describe("Message receipt handle"),
    },
    async ({ queueUrl, receiptHandle }) => {
      try {
        await client.send(
          new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: receiptHandle,
          }),
        );
        return textResult("Message deleted successfully.");
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "sqs_purge_queue",
    "Purge all messages from an SQS queue",
    { queueUrl: z.string().describe("Queue URL") },
    async ({ queueUrl }) => {
      try {
        await client.send(new PurgeQueueCommand({ QueueUrl: queueUrl }));
        return textResult("Queue purged successfully.");
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "sqs_get_queue_attributes",
    "Get attributes of an SQS queue",
    {
      queueUrl: z.string().describe("Queue URL"),
      attributeNames: z
        .array(z.string())
        .optional()
        .default(["All"])
        .describe('Attribute names to retrieve (default: ["All"])'),
    },
    async ({ queueUrl, attributeNames }) => {
      try {
        const response = await client.send(
          new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: attributeNames as any,
          }),
        );
        return jsonResult(response.Attributes ?? {});
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
