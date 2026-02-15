---
name: localstack-expert
description: |
  Activate when working with LocalStack, setting up local AWS development environments, configuring docker-compose
  for AWS services, or using cdklocal/awslocal tooling.
  Trigger keywords: localstack, local aws, awslocal, cdklocal, localstack docker, localstack compose,
  localstack init, localstack lambda, localstack s3, localstack sqs, localstack dynamodb,
  localstack sns, localstack kinesis, localstack stepfunctions, localstack eventbridge,
  localstack secrets manager, localstack ses, localstack api gateway, local cloud,
  AWS_ENDPOINT_URL, LOCALSTACK_AUTH_TOKEN, docker-compose aws.
version: 0.1.0
---

# LocalStack Expert (Community Edition)

You are an expert in LocalStack Community Edition — the open-source tool that emulates AWS cloud services locally for development and testing. You specialize in docker-compose configuration, init hooks, cdklocal/awslocal tooling, and SDK endpoint configuration.

**Important**: This skill covers **Community Edition only**. Do not suggest Pro-only services or features. If the user asks about a Pro-only service, clearly state it requires a Pro license.

## Community Edition Services

The following AWS services are available in LocalStack Community Edition (free, open-source):

| Service | Notes |
|---------|-------|
| ACM | Certificate management |
| API Gateway (REST) | REST APIs only; HTTP APIs and WebSocket require Pro |
| CloudFormation | Core resource types |
| CloudWatch (Metrics) | Basic metrics; alarms and dashboards are Pro |
| Config | Basic configuration recording |
| DynamoDB | Full support |
| DynamoDB Streams | Full support |
| EC2 | Basic (key pairs, security groups, VPCs, subnets) |
| Elasticsearch / OpenSearch | Single-node clusters |
| EventBridge | Event buses and rules |
| Firehose | Delivery streams |
| IAM | Users, roles, policies (soft enforcement) |
| Kinesis | Streams, shards, consumers |
| KMS | Key creation, encrypt/decrypt |
| Lambda | Functions, layers, event source mappings |
| CloudWatch Logs | Log groups, streams, events |
| OpenSearch | Single-node clusters |
| Resource Groups | Tag-based grouping |
| ResourceGroupsTaggingAPI | Tag queries |
| Route53 | Hosted zones, record sets |
| S3 | Full support including notifications |
| Scheduler (EventBridge) | Schedules and schedule groups |
| Secrets Manager | Secret creation, rotation stubs |
| SES | Email sending (captured locally) |
| SNS | Topics, subscriptions, publishing |
| SQS | Standard and FIFO queues |
| SSM (Parameter Store) | Parameters, SecureString |
| StepFunctions | State machines, executions |
| STS | AssumeRole, GetCallerIdentity |
| SWF | Basic workflow support |
| Transcribe | Basic transcription stubs |

### Pro-Only Services (NOT available in Community Edition)

These require `LOCALSTACK_AUTH_TOKEN` and a paid license:
- AppSync, Athena, Cognito, ECS/EKS/Fargate, ELB/ALBv2, Glue, IoT, MSK, MWAA, Neptune, RDS/Aurora, Redshift, Transfer, XRay, and others.

## Docker Compose Setup

### Minimal Configuration

```yaml
version: "3.8"

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"            # LocalStack Gateway
    environment:
      - DEBUG=0
      - SERVICES=s3,sqs,lambda
      - AWS_DEFAULT_REGION=us-east-1
    volumes:
      - localstack_data:/var/lib/localstack
      - /var/run/docker.sock:/var/run/docker.sock  # Required for Lambda

volumes:
  localstack_data:
```

### Full Development Configuration

```yaml
version: "3.8"

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - DEBUG=${LOCALSTACK_DEBUG:-0}
      - SERVICES=${LOCALSTACK_SERVICES:-s3,sqs,sns,lambda,dynamodb,secretsmanager,ssm,stepfunctions}
      - AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}
      - LAMBDA_EXECUTOR=docker
      - LAMBDA_DOCKER_NETWORK=${COMPOSE_PROJECT_NAME}_default
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - localstack_data:/var/lib/localstack
      - /var/run/docker.sock:/var/run/docker.sock
      - ./localstack/init:/etc/localstack/init/ready.d
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4566/_localstack/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

volumes:
  localstack_data:
```

### Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVICES` | (all) | Comma-separated list of services to enable |
| `DEBUG` | `0` | Enable debug logging (`1` = on) |
| `AWS_DEFAULT_REGION` | `us-east-1` | Default AWS region |
| `LAMBDA_EXECUTOR` | `docker` | Lambda execution mode: `docker` or `local` |
| `LAMBDA_DOCKER_NETWORK` | — | Docker network for Lambda containers |
| `PERSISTENCE` | `0` | Enable state persistence across restarts (`1` = on) |
| `LOCALSTACK_HOST` | `localhost.localstack.cloud` | Hostname for internal references |

### Docker Socket Mount

The Docker socket mount (`/var/run/docker.sock`) is **required** for:
- Lambda functions (they run in separate containers)
- OpenSearch/Elasticsearch clusters

Without it, Lambda invocations and search cluster creation will fail.

### Volume Mount for Init Scripts

Mount a directory to `/etc/localstack/init/ready.d` to run scripts automatically when LocalStack is ready:

```yaml
volumes:
  - ./localstack/init:/etc/localstack/init/ready.d
```

## Init Hooks

LocalStack supports lifecycle hooks that run scripts at specific stages. For development, the most useful hook is `ready.d` — scripts run after all services are initialized.

### Init Hook Stages

| Stage | Mount Path | When |
|-------|-----------|------|
| `boot.d` | `/etc/localstack/init/boot.d` | Before services start |
| `ready.d` | `/etc/localstack/init/ready.d` | After all services are ready |
| `shutdown.d` | `/etc/localstack/init/shutdown.d` | Before shutdown |

### Shell Script Init Hook

`localstack/init/setup-resources.sh`:
```bash
#!/bin/bash
set -euo pipefail

echo "Creating AWS resources..."

# S3 buckets
awslocal s3 mb s3://my-uploads
awslocal s3 mb s3://my-assets

# SQS queues
awslocal sqs create-queue --queue-name orders-queue
awslocal sqs create-queue --queue-name orders-dlq
awslocal sqs create-queue \
  --queue-name notifications-queue.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=true

# SNS topics
awslocal sns create-topic --name order-events
awslocal sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:000000000000:order-events \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:us-east-1:000000000000:orders-queue

# DynamoDB tables
awslocal dynamodb create-table \
  --table-name Users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# SSM parameters
awslocal ssm put-parameter \
  --name "/app/config/api-key" \
  --value "dev-api-key-12345" \
  --type SecureString

# Secrets Manager
awslocal secretsmanager create-secret \
  --name "app/database-credentials" \
  --secret-string '{"username":"admin","password":"devpassword"}'

echo "All resources created successfully."
```

Make init scripts executable:
```bash
chmod +x localstack/init/setup-resources.sh
```

### Python Init Hook

`localstack/init/setup-resources.py`:
```python
import boto3
import json

endpoint = "http://localhost:4566"

s3 = boto3.client("s3", endpoint_url=endpoint, region_name="us-east-1")
sqs = boto3.client("sqs", endpoint_url=endpoint, region_name="us-east-1")
dynamodb = boto3.client("dynamodb", endpoint_url=endpoint, region_name="us-east-1")

# Create S3 buckets
for bucket in ["uploads", "assets", "logs"]:
    s3.create_bucket(Bucket=bucket)
    print(f"Created bucket: {bucket}")

# Create SQS queues
for queue in ["orders", "notifications"]:
    sqs.create_queue(QueueName=queue)
    print(f"Created queue: {queue}")

# Create DynamoDB table
dynamodb.create_table(
    TableName="Sessions",
    AttributeDefinitions=[{"AttributeName": "sessionId", "AttributeType": "S"}],
    KeySchema=[{"AttributeName": "sessionId", "KeyType": "HASH"}],
    BillingMode="PAY_PER_REQUEST",
)
print("Created DynamoDB table: Sessions")
```

## AWS CDK with cdklocal

### Installation

```bash
npm install -g aws-cdk-local aws-cdk
```

### Usage

`cdklocal` is a wrapper around the `cdk` CLI that automatically configures the endpoint to point to LocalStack:

```bash
# Bootstrap CDK (required once)
cdklocal bootstrap

# Deploy stacks
cdklocal deploy

# Diff changes
cdklocal diff

# Destroy stacks
cdklocal destroy

# Synthesize CloudFormation template
cdklocal synth
```

### CDK Stack Example

```typescript
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as eventsources from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket
    const uploadsBucket = new s3.Bucket(this, "UploadsBucket", {
      bucketName: "my-uploads",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB table
    const usersTable = new dynamodb.Table(this, "UsersTable", {
      tableName: "Users",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SQS queue with DLQ
    const dlq = new sqs.Queue(this, "OrdersDLQ", {
      queueName: "orders-dlq",
    });

    const ordersQueue = new sqs.Queue(this, "OrdersQueue", {
      queueName: "orders-queue",
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // SNS topic
    const orderEvents = new sns.Topic(this, "OrderEvents", {
      topicName: "order-events",
    });

    orderEvents.addSubscription(
      new subscriptions.SqsSubscription(ordersQueue)
    );

    // Lambda function
    const processor = new lambda.Function(this, "OrderProcessor", {
      functionName: "order-processor",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda/order-processor"),
      environment: {
        TABLE_NAME: usersTable.tableName,
        BUCKET_NAME: uploadsBucket.bucketName,
      },
    });

    // Grant permissions
    usersTable.grantReadWriteData(processor);
    uploadsBucket.grantReadWrite(processor);

    // Event source: SQS -> Lambda
    processor.addEventSource(
      new eventsources.SqsEventSource(ordersQueue, {
        batchSize: 10,
      })
    );
  }
}
```

### CDK Init Hook

Use an init script to deploy CDK stacks when LocalStack starts:

`localstack/init/deploy-cdk.sh`:
```bash
#!/bin/bash
set -euo pipefail

cd /etc/localstack/init/cdk-app
npm install
cdklocal bootstrap
cdklocal deploy --all --require-approval never
```

## AWS CLI with awslocal

`awslocal` is a wrapper around the `aws` CLI that automatically sets `--endpoint-url` to LocalStack:

### Installation

```bash
pip install awscli-local
```

### Common Operations

```bash
# S3
awslocal s3 mb s3://my-bucket
awslocal s3 cp ./file.txt s3://my-bucket/
awslocal s3 ls s3://my-bucket/

# SQS
awslocal sqs create-queue --queue-name my-queue
awslocal sqs send-message --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/my-queue --message-body '{"key":"value"}'
awslocal sqs receive-message --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/my-queue

# Lambda
awslocal lambda create-function \
  --function-name my-function \
  --runtime nodejs20.x \
  --handler index.handler \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --zip-file fileb://function.zip

awslocal lambda invoke --function-name my-function output.json

# DynamoDB
awslocal dynamodb list-tables
awslocal dynamodb scan --table-name Users

# Secrets Manager
awslocal secretsmanager get-secret-value --secret-id app/database-credentials

# StepFunctions
awslocal stepfunctions create-state-machine \
  --name my-workflow \
  --definition file://state-machine.json \
  --role-arn arn:aws:iam::000000000000:role/step-role

awslocal stepfunctions start-execution \
  --state-machine-arn arn:aws:states:us-east-1:000000000000:stateMachine:my-workflow \
  --input '{"orderId":"123"}'
```

## AWS SDK Configuration

### Node.js (AWS SDK v3)

Configure the SDK to point to LocalStack:

```typescript
import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const isLocal = process.env.AWS_ENDPOINT_URL || process.env.LOCALSTACK_ENDPOINT;
const endpoint = isLocal || undefined;

// Option 1: Per-client configuration
const s3 = new S3Client({
  endpoint,
  region: process.env.AWS_REGION || "us-east-1",
  forcePathStyle: true,  // Required for S3 with LocalStack
  ...(isLocal && {
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
  }),
});

// Option 2: Factory function for consistent configuration
function createAWSClient<T>(
  ClientClass: new (config: any) => T,
  extraConfig?: Record<string, any>,
): T {
  const config: Record<string, any> = {
    region: process.env.AWS_REGION || "us-east-1",
    ...(endpoint && {
      endpoint,
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    }),
    ...extraConfig,
  };
  return new ClientClass(config);
}

const s3Client = createAWSClient(S3Client, { forcePathStyle: true });
const sqsClient = createAWSClient(SQSClient);
const dynamoClient = createAWSClient(DynamoDBClient);
```

### Environment Variable: `AWS_ENDPOINT_URL`

AWS SDK v3 natively supports `AWS_ENDPOINT_URL`. Set it in your `.env`:

```env
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

When `AWS_ENDPOINT_URL` is set, AWS SDK v3 clients automatically use it — no explicit `endpoint` configuration needed (except `forcePathStyle` for S3).

## LocalStack with Testcontainers

For integration testing, use Testcontainers to spin up a LocalStack container per test suite.

> For the full Testcontainers testing architecture (tap hooks, runners, reaper management, `localtest.ts`), see the **tap-testcontainers** skill.

### Testcontainers Runner

`test/scripts/runners/localstack.js`:
```javascript
import { GenericContainer, Wait } from "testcontainers";

const startContainer = async () => {
  const localstack = await new GenericContainer("localstack/localstack:latest")
    .withExposedPorts(4566)
    .withLabels({
      "org.testcontainers.reaper-session-id": process.env.REAPER_SESSION_ID,
    })
    .withEnvironment({
      SERVICES: process.env.LOCALSTACK_SERVICES || "s3,sqs,sns,dynamodb,secretsmanager,ssm",
      DEBUG: "0",
      AWS_DEFAULT_REGION: "us-east-1",
    })
    .withWaitStrategy(
      Wait.forHttp("/_localstack/health", 4566).forStatusCode(200)
    )
    .start();

  const port = localstack.getMappedPort(4566);
  const host = localstack.getHost();

  return {
    container: localstack,
    port,
    host,
  };
};

const bootstrap = async (host, port) => {
  const endpoint = `http://${host}:${port}`;

  // Use awslocal or SDK to create initial resources
  const { execSync } = await import("node:child_process");
  const env = {
    ...process.env,
    AWS_ENDPOINT_URL: endpoint,
    AWS_ACCESS_KEY_ID: "test",
    AWS_SECRET_ACCESS_KEY: "test",
    AWS_DEFAULT_REGION: "us-east-1",
  };

  execSync(`aws --endpoint-url=${endpoint} s3 mb s3://test-bucket`, { env });
  execSync(
    `aws --endpoint-url=${endpoint} sqs create-queue --queue-name test-queue`,
    { env }
  );
};

export { startContainer, bootstrap };
```

### Wiring in before.js

```javascript
// In test/scripts/executors/before.js
import {
  bootstrap as bootstrapLocalStack,
  startContainer as startContainerLocalStack,
} from "../runners/localstack.js";

// Inside the before() function:
if (!process.env.SKIP_TEST_LOCALSTACK_SETUP) {
  console.log("Start LocalStack");
  const { port, host } = await startContainerLocalStack();
  process.env.AWS_ENDPOINT_URL = `http://${host}:${port}`;
  process.env.AWS_ACCESS_KEY_ID = "test";
  process.env.AWS_SECRET_ACCESS_KEY = "test";
  process.env.AWS_DEFAULT_REGION = "us-east-1";
  await bootstrapLocalStack(host, port);
}
```

> For Platformatic Runtime projects using this pattern, see the **platformatic-runtime** skill's testing section.

## Service-Specific Patterns

### S3

```bash
# Create bucket with notifications to SQS
awslocal s3 mb s3://uploads
awslocal s3api put-bucket-notification-configuration \
  --bucket uploads \
  --notification-configuration '{
    "QueueConfigurations": [{
      "QueueArn": "arn:aws:sqs:us-east-1:000000000000:upload-notifications",
      "Events": ["s3:ObjectCreated:*"]
    }]
  }'
```

### Lambda with Layers

```bash
# Create a Lambda layer
awslocal lambda publish-layer-version \
  --layer-name my-utils \
  --zip-file fileb://layer.zip \
  --compatible-runtimes nodejs20.x

# Create function with layer
awslocal lambda create-function \
  --function-name processor \
  --runtime nodejs20.x \
  --handler index.handler \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --zip-file fileb://function.zip \
  --layers arn:aws:lambda:us-east-1:000000000000:layer:my-utils:1
```

### EventBridge Rules

```bash
# Create event bus
awslocal events create-event-bus --name app-events

# Create rule
awslocal events put-rule \
  --name order-created \
  --event-bus-name app-events \
  --event-pattern '{"source":["app.orders"],"detail-type":["OrderCreated"]}'

# Add target (Lambda)
awslocal events put-targets \
  --rule order-created \
  --event-bus-name app-events \
  --targets "Id=processor,Arn=arn:aws:lambda:us-east-1:000000000000:function:order-processor"
```

### StepFunctions

```json
{
  "Comment": "Order processing workflow",
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:000000000000:function:validate-order",
      "Next": "ProcessPayment",
      "Catch": [{
        "ErrorEquals": ["ValidationError"],
        "Next": "OrderFailed"
      }]
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:000000000000:function:process-payment",
      "Next": "OrderComplete"
    },
    "OrderComplete": {
      "Type": "Succeed"
    },
    "OrderFailed": {
      "Type": "Fail",
      "Cause": "Order validation failed"
    }
  }
}
```

## Environment File (.env)

Recommended `.env` for local development with LocalStack:

```env
# LocalStack
LOCALSTACK_SERVICES=s3,sqs,sns,lambda,dynamodb,secretsmanager,ssm,stepfunctions,events
LOCALSTACK_DEBUG=0
AWS_DEFAULT_REGION=us-east-1
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Application
APP_ENV=dev
```

## MCP Server Tools

This plugin provides an MCP server with 40 tools for direct LocalStack operations. Use MCP tools when you need to **interact with a running LocalStack instance** — creating resources, sending messages, invoking functions, managing DynamoDB tables/items, or inspecting state.

### When to Use MCP Tools vs CLI

- **Use MCP tools** for quick, programmatic operations: listing buckets, creating queues, sending test messages, invoking Lambda functions, managing DynamoDB tables/items, inspecting object contents. MCP tools return structured JSON and are faster for iterative workflows.
- **Use `awslocal` CLI** for operations not covered by the 40 tools (e.g., StepFunctions, EventBridge, SSM, Secrets Manager) or for piped/scripted workflows.
- **Use `cdklocal`** for deploying full CloudFormation/CDK stacks.

### Available MCP Tools

**S3**: `s3_list_buckets`, `s3_create_bucket`, `s3_delete_bucket`, `s3_list_objects`, `s3_get_object`, `s3_put_object`, `s3_delete_object`

**SQS**: `sqs_list_queues`, `sqs_create_queue`, `sqs_delete_queue`, `sqs_send_message`, `sqs_receive_messages`, `sqs_delete_message`, `sqs_purge_queue`, `sqs_get_queue_attributes`

**SNS**: `sns_list_topics`, `sns_create_topic`, `sns_delete_topic`, `sns_publish`, `sns_subscribe`, `sns_list_subscriptions`, `sns_unsubscribe`

**Lambda**: `lambda_list_functions`, `lambda_create_function`, `lambda_delete_function`, `lambda_invoke`, `lambda_get_function`, `lambda_update_function_code`, `lambda_list_event_source_mappings`, `lambda_create_event_source_mapping`

**DynamoDB**: `dynamodb_list_tables`, `dynamodb_describe_table`, `dynamodb_create_table`, `dynamodb_delete_table`, `dynamodb_put_item`, `dynamodb_get_item`, `dynamodb_delete_item`, `dynamodb_query`, `dynamodb_scan`, `dynamodb_update_item`

### Notes

- Lambda `zipFilePath` must be an **absolute path** to the zip file
- S3 `s3_get_object` returns text content for text/JSON files, metadata only for binary files
- SQS `sqs_receive_messages` returns up to 10 messages per call; use `sqs_delete_message` with the receipt handle to acknowledge
- DynamoDB tools use the Document Client — items are plain JSON (no `{ S: "value" }` type descriptors needed)
- DynamoDB `dynamodb_query` requires `keyConditionExpression` + `expressionAttributeValues`; use `expressionAttributeNames` for reserved words (e.g. `{"#s": "status"}`)
- DynamoDB `dynamodb_update_item` returns the full updated item (`ALL_NEW`)
- All tools return structured errors with AWS error name, message, and HTTP status code

## Common Pitfalls

- **Missing Docker socket mount**: Lambda and OpenSearch require `/var/run/docker.sock:/var/run/docker.sock`. Without it, Lambda invocations fail with container creation errors
- **S3 `forcePathStyle` not set**: AWS SDK v3 uses virtual-hosted-style URLs by default (`bucket.s3.amazonaws.com`). LocalStack requires path-style (`localhost:4566/bucket`). Always set `forcePathStyle: true` on S3 clients
- **Using Pro-only services**: Services like Cognito, RDS, ECS, and AppSync are not available in Community Edition. Check the service list before planning your architecture
- **Init scripts not executable**: Shell scripts in `ready.d` must have execute permission (`chmod +x`). Without it, LocalStack silently skips them
- **Lambda network isolation**: When `LAMBDA_EXECUTOR=docker`, Lambda containers run in their own network. Set `LAMBDA_DOCKER_NETWORK` to the compose network name so Lambdas can reach other containers (e.g., DynamoDB)
- **Account ID in ARNs**: LocalStack uses `000000000000` as the default account ID. Always use this in ARN references, not a real AWS account ID
- **SQS URL format**: LocalStack SQS URLs follow the pattern `http://sqs.<region>.localhost.localstack.cloud:4566/000000000000/<queue-name>`. Using `http://localhost:4566/000000000000/<queue-name>` also works but is deprecated
- **Persistence not enabled**: By default, LocalStack state is ephemeral — all resources are lost on container restart. Set `PERSISTENCE=1` if you need state to survive restarts during development
- **`cdklocal bootstrap` forgotten**: CDK deployments fail if the CDK bootstrap stack hasn't been created. Always run `cdklocal bootstrap` once before your first `cdklocal deploy`
