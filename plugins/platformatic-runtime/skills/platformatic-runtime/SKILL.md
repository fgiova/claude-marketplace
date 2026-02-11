---
name: platformatic-runtime
description: |
  Activate when working with Platformatic Runtime, composing services, configuring watt.json, or discussing Platformatic project structure and testing.
  Trigger keywords: platformatic, platformatic runtime, plt, watt, watt.json, service composition,
  platformatic service, platformatic node, @platformatic/node, @platformatic/service,
  @platformatic/runtime, create() function, entrypoint, pnpm workspaces monorepo,
  testcontainers, unit test platformatic, integration test platformatic.
version: 0.1.0
---

# Platformatic Runtime Expert

This document describes how to manage a project based on **Platformatic Runtime**.

## Platformatic Runtime Overview

Platformatic Runtime orchestrates multiple Node.js/Fastify services in a single process, enabling efficient inter-service communication and centralized management.

### Key Concepts

- **Runtime**: The main process that orchestrates all services
- **Service**: An individual Fastify application (can be `@platformatic/node` or `@platformatic/service`)
- **Entrypoint**: The service that receives external traffic
- **watt.json**: Main runtime configuration file

## Project Structure

```
project-root/
├── watt.json                    # Runtime configuration (development)
├── watt.production.json         # Runtime configuration (production)
├── package.json                 # Monorepo with pnpm workspaces
├── test/                        # Centralized tests for all services
│   ├── helpers/
│   │   └── localtest.ts        # Test environment setup
│   ├── scripts/
│   │   ├── executors/          # Testcontainers setup/teardown
│   │   └── runners/            # Container runners (mysql, redis, localstack)
│   ├── unit/                    # Unit tests per service
│   │   ├── service-a/
│   │   └── service-b/
│   └── integration/             # Integration tests per service
│       ├── service-a/
│       └── service-b/
├── web/                         # Platformatic services
│   ├── service-a/
│   │   ├── watt.json           # Service configuration
│   │   ├── index.ts            # Entry point (export create())
│   │   ├── config.ts           # Environment configuration
│   │   ├── plugins/            # Fastify plugins
│   │   ├── routes/             # HTTP/REST routes
│   │   ├── graphql/            # GraphQL resolvers and schema
│   │   ├── helpers/            # Business logic
│   │   └── types/              # TypeScript types
│   └── service-b/
├── db/                          # Prisma schema per service
│   └── service-a/
│       ├── schema.prisma
│       └── prisma.config.ts
├── clients/                     # Generated API clients
├── plugins/                     # Common plugins for services
├── cdk/                         # AWS CDK infrastructure
└── external/                    # External services (git resolved)
```

## Runtime Configuration (watt.json)

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/runtime/3.19.0.json",
  "watch": true,
  "applications": [
    {
      "id": "service-name",
      "path": "./web/service-name",
      "env": {
        "DATABASE_NAME": "{DATABASE_NAME_SERVICE}"
      }
    },
    {
      "id": "external-service",
      "path": "{PLT_EXTERNAL_PATH}",
      "url": "git@gitlab.com:org/external-service.git",
      "gitBranch": "main",
      "watch": false
    },
    {
      "id": "gateway",
      "path": "./web/gateway",
      "config": "./watt.dev.json"
    }
  ],
  "logger": {
    "level": "{PLT_SERVER_LOGGER_LEVEL}"
  },
  "server": {
    "hostname": "{PLT_SERVER_HOSTNAME}",
    "port": "{PORT}"
  },
  "managementApi": "{PLT_MANAGEMENT_API}",
  "entrypoint": "gateway"
}
```

### Environment Variables

Variables in the format `{VAR_NAME}` are replaced with values from:
- `.env` file in the project root
- System environment variables
- `env` configuration in the `applications` block

## Service Configuration

Each service has its own `watt.json`:

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/node/3.19.0.json"
}
```

### Entry Point Pattern

Each Platformatic service must export a `create()` function that returns a Fastify instance:

```typescript
// web/service-name/index.ts
export async function create() {
  const app = fastify({ logger: true });
  // ... setup plugins and routes
  await app.ready();
  return app;
}
```

---

## Testing Strategy for Platformatic

### Key Principle: Unit vs Integration Tests

**IMPORTANT**: Do not always use the `create()` function for tests.

- **Unit Tests**: Create a new Fastify instance with the **minimum set of plugins needed** to test a single unit (helper, route, plugin)
- **Integration Tests**: Use `create()` only to verify the correct startup of the entire application and the interaction between components

This approach ensures:
- Faster and more isolated tests
- Precise problem identification
- Lower resource consumption during tests

---

## Useful Commands

```bash
# Development
pnpm dev                          # Start runtime in watch mode

# Production build
pnpm build
```

## Best Practices

1. **Centralized tests in root**: All tests are in the `test/` folder, organized by type (unit/integration) and then by service
2. **`create()` only for integration**: Use the `create()` function only for integration tests
3. **Mirror structure**: The folder structure in `test/unit/service-name/` should mirror the structure of `web/service-name/`
4. **Service isolation**: Each service should have its own configuration and database schema
5. **External services**: Use git-resolved external services in `watt.json` for shared dependencies

