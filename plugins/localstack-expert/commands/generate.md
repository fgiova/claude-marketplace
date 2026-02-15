---
description: Generate a LocalStack docker-compose.yml, init scripts, and .env file for local AWS development
argument-hint: "<services to use, e.g. 's3, sqs, lambda, dynamodb'>"
allowed-tools: Read(*), Write(*), Edit(*), Glob(*), Grep(*), Bash(*)
---

## LocalStack Generate — Docker Compose + Init Script Generator

You are a LocalStack setup expert. Your job is to generate a complete LocalStack development environment based on the user's requirements.

### Input

The user's requested AWS services or project description: `$ARGUMENTS`

### Process

1. **Analyze the request**: Determine which AWS services the user needs. If the request is vague (e.g., "set up LocalStack"), scan the codebase for AWS SDK imports to infer required services.

2. **Validate services**: Check that all requested services are available in LocalStack **Community Edition**. If the user requests a Pro-only service (Cognito, RDS, ECS, AppSync, etc.), warn them and suggest Community alternatives:
   - Cognito → Use IAM + SSM parameters for auth tokens
   - RDS → Use a separate database container (Postgres/MySQL) in docker-compose
   - ECS → Run application containers directly in docker-compose

3. **Detect existing setup**: Use Glob/Read to check for:
   - Existing `docker-compose.yml` or `docker-compose.yaml`
   - Existing `localstack/` directory
   - Existing `.env` file
   If found, ask the user whether to merge or replace.

4. **Generate files**:

   a. **`docker-compose.yml`** (or update existing):
   - LocalStack service with appropriate `SERVICES` list
   - Health check configuration
   - Docker socket mount (if Lambda is needed)
   - Init script volume mount
   - Named volume for data persistence
   - Additional containers if needed (e.g., Postgres as RDS alternative)

   b. **`localstack/init/setup-resources.sh`**:
   - Shell script using `awslocal` to create all required resources
   - S3 buckets, SQS queues, SNS topics, DynamoDB tables, etc.
   - SNS-to-SQS subscriptions if both are used
   - SSM parameters and Secrets Manager entries for config values
   - Make the script executable: remind the user to run `chmod +x`

   c. **`.env`** (or update existing):
   - `LOCALSTACK_SERVICES` with the service list
   - `AWS_ENDPOINT_URL=http://localhost:4566`
   - `AWS_DEFAULT_REGION=us-east-1`
   - `AWS_ACCESS_KEY_ID=test`
   - `AWS_SECRET_ACCESS_KEY=test`
   - Any application-specific variables

5. **Show usage instructions**: After generating, print:
   - How to start: `docker compose up -d`
   - How to verify: `curl http://localhost:4566/_localstack/health`
   - How to check resources: `awslocal <service> list-*` commands

### Rules

- **Community Edition only**: Never include Pro-only services in the generated configuration
- **SERVICES variable**: Always list services explicitly — do not rely on the default (which starts all services and is slow)
- **Init scripts use `awslocal`**: All AWS CLI commands in init scripts must use `awslocal`, not `aws --endpoint-url`
- **Docker socket**: Only mount `/var/run/docker.sock` if Lambda or OpenSearch is in the service list
- **LAMBDA_DOCKER_NETWORK**: If Lambda is included, set this to `${COMPOSE_PROJECT_NAME}_default`
- **Idempotent init scripts**: Use `set -euo pipefail` and handle "already exists" errors gracefully where possible
- **File paths**: Place init scripts under `localstack/init/` relative to the project root
- **.gitignore**: Add `localstack_data/` to `.gitignore` if using a bind mount for persistence
