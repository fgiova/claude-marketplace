# LocalStack Expert Plugin

LocalStack Community Edition expertise for local AWS development, docker-compose setup, and SDK configuration.

## Overview

This plugin provides contextual expertise when working with LocalStack for local AWS development and testing. It auto-activates on LocalStack-related prompts and includes commands for generating and auditing LocalStack configurations.

## Skill

### localstack-expert

**Auto-activates** on keywords: `localstack`, `awslocal`, `cdklocal`, `localstack docker`, `localstack compose`, `localstack init`, `AWS_ENDPOINT_URL`, `local aws`, etc.

Provides expertise in:

- **Community Edition Services**: Full reference of available services (S3, SQS, SNS, Lambda, DynamoDB, StepFunctions, EventBridge, and more)
- **Docker Compose Setup**: Minimal and full development configurations with health checks, volumes, and init scripts
- **Init Hooks**: Shell and Python scripts for automated resource creation on startup
- **AWS CDK (cdklocal)**: CDK stack deployment to LocalStack with bootstrap and deploy workflows
- **AWS CLI (awslocal)**: Common operations for all supported services
- **SDK Configuration**: AWS SDK v3 endpoint configuration, `forcePathStyle` for S3, factory patterns
- **Testcontainers Integration**: LocalStack runner for integration testing with tap-testcontainers
- **Service Patterns**: S3 notifications, Lambda layers, EventBridge rules, StepFunctions workflows

## Commands

### `/localstack-expert:generate`

Generates a complete LocalStack development environment:
- `docker-compose.yml` with LocalStack service configuration
- `localstack/init/setup-resources.sh` init script with resource creation
- `.env` with LocalStack environment variables

Usage:
```
/localstack-expert:generate s3, sqs, lambda, dynamodb
/localstack-expert:generate set up LocalStack for an event-driven order processing system
```

### `/localstack-expert:analyze`

Analyzes existing LocalStack configuration for issues and improvements. Read-only — reports findings without modifying files.

Checks for:
- Missing Docker socket mount, incorrect init paths, Pro-only service usage
- S3 clients without `forcePathStyle`, hardcoded endpoints, region mismatches
- Unused services, missing health checks, resource consistency

Usage:
```
/localstack-expert:analyze
/localstack-expert:analyze ./docker-compose.yml
```

## MCP Server

The plugin includes an MCP (Model Context Protocol) server that provides 40 tools for direct CRUD operations against a LocalStack instance. The server communicates via stdio and requires no build step.

### Setup

1. Install dependencies:
   ```bash
   cd plugins/localstack-expert/mcp-server && npm install
   ```
2. Ensure LocalStack is running on `localhost:4566`
3. The MCP server starts automatically when the plugin is loaded by Claude Code

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_ENDPOINT_URL` | `http://localhost:4566` | LocalStack endpoint |
| `AWS_REGION` | `us-east-1` | AWS region |
| `AWS_ACCESS_KEY_ID` | `test` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | `test` | AWS secret key |

### Tools (40 total)

**S3 (7 tools)**: `s3_list_buckets`, `s3_create_bucket`, `s3_delete_bucket`, `s3_list_objects`, `s3_get_object`, `s3_put_object`, `s3_delete_object`

**SQS (8 tools)**: `sqs_list_queues`, `sqs_create_queue`, `sqs_delete_queue`, `sqs_send_message`, `sqs_receive_messages`, `sqs_delete_message`, `sqs_purge_queue`, `sqs_get_queue_attributes`

**SNS (7 tools)**: `sns_list_topics`, `sns_create_topic`, `sns_delete_topic`, `sns_publish`, `sns_subscribe`, `sns_list_subscriptions`, `sns_unsubscribe`

**Lambda (8 tools)**: `lambda_list_functions`, `lambda_create_function`, `lambda_delete_function`, `lambda_invoke`, `lambda_get_function`, `lambda_update_function_code`, `lambda_list_event_source_mappings`, `lambda_create_event_source_mapping`

**DynamoDB (10 tools)**: `dynamodb_list_tables`, `dynamodb_describe_table`, `dynamodb_create_table`, `dynamodb_delete_table`, `dynamodb_put_item`, `dynamodb_get_item`, `dynamodb_delete_item`, `dynamodb_query`, `dynamodb_scan`, `dynamodb_update_item`

## Cross-References

- **tap-testcontainers**: For the full Testcontainers testing architecture (tap hooks, runners, reaper management) — the LocalStack runner integrates with this pattern
- **platformatic-runtime**: For Platformatic Runtime projects that use LocalStack in their testing setup

## Installation

```bash
/plugin marketplace add https://github.com/fgiova/claude-marketplace
/plugin install localstack-expert@fgiova-claude-marketplace
```

## Usage

The skill activates automatically when you work with LocalStack. Examples:

```
"Set up LocalStack with S3 and SQS for local development"
"Create a docker-compose.yml for LocalStack with Lambda support"
"Configure the AWS SDK to point to LocalStack"
"Write an init script to create DynamoDB tables on startup"
"Deploy a CDK stack to LocalStack using cdklocal"
```

## License

MIT
