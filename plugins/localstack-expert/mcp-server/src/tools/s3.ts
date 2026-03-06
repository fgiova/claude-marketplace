import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { createS3Client } from "../client-factory.js";
import { textResult, jsonResult, errorResult } from "../utils.js";

export function registerS3Tools(server: McpServer): void {
  const client = createS3Client();

  server.tool("s3_list_buckets", "List all S3 buckets", {}, async () => {
    try {
      const response = await client.send(new ListBucketsCommand({}));
      return jsonResult(response.Buckets ?? []);
    } catch (error) {
      return errorResult(error);
    }
  });

  server.tool(
    "s3_create_bucket",
    "Create an S3 bucket",
    { bucket: z.string().describe("Bucket name") },
    async ({ bucket }) => {
      try {
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
        return textResult(`Bucket "${bucket}" created successfully.`);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "s3_delete_bucket",
    "Delete an S3 bucket",
    { bucket: z.string().describe("Bucket name") },
    async ({ bucket }) => {
      try {
        await client.send(new DeleteBucketCommand({ Bucket: bucket }));
        return textResult(`Bucket "${bucket}" deleted successfully.`);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "s3_list_objects",
    "List objects in an S3 bucket",
    {
      bucket: z.string().describe("Bucket name"),
      prefix: z.string().optional().describe("Key prefix filter"),
      maxKeys: z
        .number()
        .optional()
        .default(100)
        .describe("Maximum number of keys to return (default 100)"),
    },
    async ({ bucket, prefix, maxKeys }) => {
      try {
        const response = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            MaxKeys: maxKeys,
          }),
        );
        return jsonResult({
          objects: response.Contents ?? [],
          isTruncated: response.IsTruncated ?? false,
          keyCount: response.KeyCount ?? 0,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "s3_get_object",
    "Get an object from S3. Returns text content for text/JSON, metadata for binary.",
    {
      bucket: z.string().describe("Bucket name"),
      key: z.string().describe("Object key"),
    },
    async ({ bucket, key }) => {
      try {
        const response = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key }),
        );
        const contentType = response.ContentType ?? "application/octet-stream";
        const isText =
          contentType.startsWith("text/") ||
          contentType.includes("json") ||
          contentType.includes("xml") ||
          contentType.includes("yaml") ||
          contentType.includes("javascript");

        if (isText && response.Body) {
          const body = await response.Body.transformToString();
          return jsonResult({
            contentType,
            contentLength: response.ContentLength,
            lastModified: response.LastModified,
            body,
          });
        }

        return jsonResult({
          contentType,
          contentLength: response.ContentLength,
          lastModified: response.LastModified,
          eTag: response.ETag,
          note: "Binary content — use awslocal or SDK to download.",
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "s3_put_object",
    "Upload an object to S3",
    {
      bucket: z.string().describe("Bucket name"),
      key: z.string().describe("Object key"),
      body: z.string().describe("Object content (text)"),
      contentType: z
        .string()
        .optional()
        .describe("Content-Type (default: application/octet-stream)"),
    },
    async ({ bucket, key, body, contentType }) => {
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
          }),
        );
        return textResult(
          `Object "${key}" uploaded to bucket "${bucket}" successfully.`,
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.tool(
    "s3_delete_object",
    "Delete an object from S3",
    {
      bucket: z.string().describe("Bucket name"),
      key: z.string().describe("Object key"),
    },
    async ({ bucket, key }) => {
      try {
        await client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: key }),
        );
        return textResult(
          `Object "${key}" deleted from bucket "${bucket}" successfully.`,
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
