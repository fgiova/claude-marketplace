import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { SNSClient } from "@aws-sdk/client-sns";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const endpoint = process.env.AWS_ENDPOINT_URL || "http://localhost:4566";
const region = process.env.AWS_REGION || "us-east-1";
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
};

let s3Client: S3Client | undefined;
let sqsClient: SQSClient | undefined;
let snsClient: SNSClient | undefined;
let lambdaClient: LambdaClient | undefined;
let dynamoDBClient: DynamoDBClient | undefined;
let dynamoDBDocClient: DynamoDBDocumentClient | undefined;

export function createS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint,
      region,
      credentials,
      forcePathStyle: true,
    });
  }
  return s3Client;
}

export function createSQSClient(): SQSClient {
  if (!sqsClient) {
    sqsClient = new SQSClient({ endpoint, region, credentials });
  }
  return sqsClient;
}

export function createSNSClient(): SNSClient {
  if (!snsClient) {
    snsClient = new SNSClient({ endpoint, region, credentials });
  }
  return snsClient;
}

export function createLambdaClient(): LambdaClient {
  if (!lambdaClient) {
    lambdaClient = new LambdaClient({ endpoint, region, credentials });
  }
  return lambdaClient;
}

export function createDynamoDBClient(): DynamoDBClient {
  if (!dynamoDBClient) {
    dynamoDBClient = new DynamoDBClient({ endpoint, region, credentials });
  }
  return dynamoDBClient;
}

export function createDynamoDBDocClient(): DynamoDBDocumentClient {
  if (!dynamoDBDocClient) {
    dynamoDBDocClient = DynamoDBDocumentClient.from(createDynamoDBClient(), {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return dynamoDBDocClient;
}
