import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListTopicsCommand,
  CreateTopicCommand,
  DeleteTopicCommand,
  PublishCommand,
  SubscribeCommand,
  ListSubscriptionsCommand,
  ListSubscriptionsByTopicCommand,
  UnsubscribeCommand,
} from "@aws-sdk/client-sns";
import { createSNSClient } from "../client-factory.js";
import { textResult, jsonResult, errorResult } from "../utils.js";

export function registerSnsTools(server: McpServer): void {
  const client = createSNSClient();

  server.tool("sns_list_topics", "List all SNS topics", {}, async () => {
    try {
      const response = await client.send(new ListTopicsCommand({}));
      return jsonResult(response.Topics ?? []);
    } catch (error) {
      return errorResult(error);
    }
  });

  server.tool(
    "sns_create_topic",
    "Create an SNS topic",
    {
      topicName: z.string().describe("Topic name"),
      attributes: z
        .record(z.string())
        .optional()
        .describe("Topic attributes (e.g. FifoTopic, ContentBasedDeduplication)"),
    },
    async ({ topicName, attributes }) => {
      try {
        const response = await client.send(
          new CreateTopicCommand({
            Name: topicName,
            Attributes: attributes,
          }),
        );
        return jsonResult({ topicArn: response.TopicArn });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "sns_delete_topic",
    "Delete an SNS topic",
    { topicArn: z.string().describe("Topic ARN") },
    async ({ topicArn }) => {
      try {
        await client.send(new DeleteTopicCommand({ TopicArn: topicArn }));
        return textResult("Topic deleted successfully.");
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "sns_publish",
    "Publish a message to an SNS topic",
    {
      topicArn: z.string().describe("Topic ARN"),
      message: z.string().describe("Message body"),
      subject: z.string().optional().describe("Message subject"),
      messageGroupId: z
        .string()
        .optional()
        .describe("Message group ID (required for FIFO topics)"),
    },
    async ({ topicArn, message, subject, messageGroupId }) => {
      try {
        const response = await client.send(
          new PublishCommand({
            TopicArn: topicArn,
            Message: message,
            Subject: subject,
            MessageGroupId: messageGroupId,
          }),
        );
        return jsonResult({ messageId: response.MessageId });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "sns_subscribe",
    "Subscribe to an SNS topic",
    {
      topicArn: z.string().describe("Topic ARN"),
      protocol: z
        .enum(["sqs", "http", "https", "email", "lambda"])
        .describe("Subscription protocol"),
      endpoint: z.string().describe("Subscription endpoint (URL, ARN, or email)"),
    },
    async ({ topicArn, protocol, endpoint }) => {
      try {
        const response = await client.send(
          new SubscribeCommand({
            TopicArn: topicArn,
            Protocol: protocol,
            Endpoint: endpoint,
          }),
        );
        return jsonResult({ subscriptionArn: response.SubscriptionArn });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "sns_list_subscriptions",
    "List SNS subscriptions, optionally filtered by topic",
    {
      topicArn: z
        .string()
        .optional()
        .describe("Topic ARN to filter subscriptions"),
    },
    async ({ topicArn }) => {
      try {
        if (topicArn) {
          const response = await client.send(
            new ListSubscriptionsByTopicCommand({ TopicArn: topicArn }),
          );
          return jsonResult(response.Subscriptions ?? []);
        }
        const response = await client.send(new ListSubscriptionsCommand({}));
        return jsonResult(response.Subscriptions ?? []);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "sns_unsubscribe",
    "Unsubscribe from an SNS topic",
    { subscriptionArn: z.string().describe("Subscription ARN") },
    async ({ subscriptionArn }) => {
      try {
        await client.send(
          new UnsubscribeCommand({ SubscriptionArn: subscriptionArn }),
        );
        return textResult("Unsubscribed successfully.");
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
