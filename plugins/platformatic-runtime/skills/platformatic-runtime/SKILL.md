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

This skill provides patterns for managing projects based on **Platformatic Runtime** — a framework that orchestrates multiple Node.js/Fastify services in a single process, enabling efficient inter-service communication and centralized management.

## Key Concepts

- **Runtime**: The main process that orchestrates all services
- **Service**: An individual Fastify application (can be `@platformatic/node` or `@platformatic/service`)
- **Entrypoint**: The service that receives external traffic
- **watt.json**: Main runtime configuration file

## Project Structure

```
project-root/
├── watt.json                    # Runtime configuration (development)
├── watt.production.json         # Runtime configuration (production)
├── package.json                 # Monorepo root
├── pnpm-workspace.yaml          # pnpm workspace definition
├── test/                        # Centralized tests for all services
│   ├── helpers/
│   │   └── localtest.ts         # Test environment setup
│   ├── scripts/
│   │   ├── executors/           # Testcontainers setup/teardown
│   │   └── runners/             # Container runners (mysql, redis, localstack)
│   ├── unit/                    # Unit tests per service
│   │   ├── service-a/
│   │   └── service-b/
│   └── integration/             # Integration tests per service
│       ├── service-a/
│       └── service-b/
├── web/                         # Platformatic services
│   ├── service-a/
│   │   ├── watt.json            # Service configuration
│   │   ├── index.ts             # Entry point (export create())
│   │   ├── config.ts            # Environment configuration
│   │   ├── plugins/             # Fastify plugins
│   │   ├── routes/              # HTTP/REST routes
│   │   ├── graphql/             # GraphQL resolvers and schema
│   │   ├── helpers/             # Business logic
│   │   └── types/               # TypeScript types
│   └── service-b/
├── db/                          # Prisma schema per service
│   └── service-a/
│       ├── schema.prisma
│       └── prisma.config.ts
├── clients/                     # Generated API clients
├── plugins/                     # Common plugins shared across services
├── cdk/                         # AWS CDK infrastructure
└── external/                    # External services (git resolved)
```

## Workspace Configuration

`pnpm-workspace.yaml`:
```yaml
packages:
  - "web/*"
  - "plugins"
  - "clients"
```

Root `package.json`:
```json
{
  "name": "my-platform",
  "private": true,
  "scripts": {
    "dev": "watt",
    "build": "watt build",
    "test": "tap --timeout=90",
    "test:coverage": "tap --coverage-report=lcovonly --coverage-report=text"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```

> For tap `before`/`after` hooks, `localtest.ts` helper, and Testcontainers executor/runner setup, see the **tap-testcontainers** skill.

## Runtime Configuration

### Development — `watt.json`

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/runtime/3.19.0.json",
  "watch": true,
  "applications": [
    {
      "id": "service-a",
      "path": "./web/service-a",
      "env": {
        "DATABASE_NAME": "{DATABASE_NAME_SERVICE_A}"
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

### Production — `watt.production.json`

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/runtime/3.19.0.json",
  "watch": false,
  "applications": [
    {
      "id": "service-a",
      "path": "./web/service-a"
    },
    {
      "id": "gateway",
      "path": "./web/gateway"
    }
  ],
  "logger": {
    "level": "info"
  },
  "server": {
    "hostname": "0.0.0.0",
    "port": "{PORT}"
  },
  "managementApi": false,
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

### Service Config — `config.ts`

Each service defines its own typed configuration using `env-schema` and `typebox`:

```typescript
// web/service-a/config.ts
import { type Static, Type } from "typebox";
import { envSchema } from "env-schema";

const ConfigSchema = Type.Object({
	APP_ENV: Type.String({ default: "dev" }),
	DATABASE_NAME: Type.String(),
	REDIS_URL: Type.String({ default: "redis://localhost:6379" }),
});

const config = envSchema<Static<typeof ConfigSchema>>({
	schema: ConfigSchema,
	dotenv: false, // env vars come from watt.json and .env at root level
});

const configExport = {
	env: config.APP_ENV,
	database: {
		name: config.DATABASE_NAME,
	},
	redis: {
		url: config.REDIS_URL,
	},
};

export type ConfigType = typeof configExport;
export default configExport;
```

### Entry Point — `create()` function

Each Platformatic service must export a `create()` function that returns a Fastify instance:

```typescript
// web/service-a/index.ts
import path from "node:path";
import autoload from "@fastify/autoload";
import fastifyRedis from "@fastify/redis";
import fastify, { type FastifyInstance } from "fastify";
import config, { type ConfigType } from "./config.js";

declare module "fastify" {
	export interface FastifyInstance {
		config: ConfigType;
	}
}

export async function create(): Promise<FastifyInstance> {
	const app = fastify({ logger: true });

	app.decorate("config", config);

	await app.register(fastifyRedis, config.redis);

	await app.register(autoload, {
		dir: path.resolve(import.meta.dirname, "./plugins"),
		options: { ...config },
	});

	await app.register(autoload, {
		dir: path.resolve(import.meta.dirname, "./routes"),
	});

	return app;
}
```

**Note**: Do NOT call `app.ready()` inside `create()` — the Platformatic Runtime handles the lifecycle.

### Route Definition

```typescript
// web/service-a/routes/v1/index.ts
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type { FastifyInstance, FastifyServerOptions } from "fastify";
import { Type } from "typebox";

const ResponseSchema = Type.Object({
	success: Type.Boolean(),
	data: Type.Optional(Type.Any()),
});

export default function (
	_fastify: FastifyInstance,
	_options: FastifyServerOptions,
	done: (err?: Error) => void,
) {
	const fastify = _fastify.withTypeProvider<TypeBoxTypeProvider>();

	fastify.get(
		"/items",
		{
			schema: {
				tags: ["items"],
				response: {
					200: ResponseSchema,
				},
			},
		},
		async (request, reply) => {
			// Business logic via helpers
			reply.send({ success: true, data: [] });
		},
	);

	done();
}
```

### Common Plugins

Plugins in the root `plugins/` directory are shared across multiple services. Register them via autoload or explicit import:

```typescript
// plugins/prisma/index.ts
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

declare module "fastify" {
	export interface FastifyInstance {
		prisma: PrismaClient;
	}
}

const prismaPlugin = (
	fastify: FastifyInstance,
	options: { databaseUrl: string },
	next: (err?: Error) => void,
) => {
	const prisma = new PrismaClient({
		datasources: {
			db: { url: options.databaseUrl },
		},
	});

	fastify.decorate("prisma", prisma);

	fastify.addHook("onClose", async () => {
		await prisma.$disconnect();
	});

	next();
};

export default fp(prismaPlugin, {
	name: "prisma",
});
```

## Inter-Service Communication

Services within the same runtime can communicate via `fetch` using the service name as hostname. The runtime intercepts these calls and routes them internally (no network overhead):

```typescript
// Inside service-a, calling service-b
const response = await fetch("http://service-b.plt.local/api/data", {
	method: "GET",
	headers: {
		"Content-Type": "application/json",
	},
});

const data = await response.json();
```

The pattern `http://<service-id>.plt.local` routes the request directly to the target service within the runtime process.

## Testing Strategy

> For Testcontainers setup (executors, runners, `localtest.ts`, reaper management), see the **tap-testcontainers** skill. This section covers Platformatic-specific testing patterns only.

### Key Principle: Unit vs Integration Tests

**IMPORTANT**: Do not always use the `create()` function for tests.

- **Unit Tests**: Create a new Fastify instance with the **minimum set of plugins needed** to test a single unit (helper, route, plugin)
- **Integration Tests**: Use `create()` only to verify the correct startup of the entire application and the interaction between components

This approach ensures:
- Faster and more isolated tests
- Precise problem identification
- Lower resource consumption during tests

### Unit Test Example

Test a single route by registering only what it needs:

```typescript
// test/unit/service-a/routes/v1/items.test.ts
import "../../../helpers/localtest";
import t from "tap";
import fastify from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import itemsRoute from "../../../../../web/service-a/routes/v1/index.js";

t.test("GET /items returns success", async (t) => {
	const app = fastify({ logger: false })
		.withTypeProvider<TypeBoxTypeProvider>();

	// Register only the route under test (and its direct dependencies)
	await app.register(itemsRoute);
	await app.ready();

	t.teardown(() => app.close());

	const response = await app.inject({
		method: "GET",
		url: "/items",
	});

	t.equal(response.statusCode, 200);
	const body = response.json();
	t.equal(body.success, true);
});
```

### Integration Test Example

Test the full service startup using `create()`:

```typescript
// test/integration/service-a/startup.test.ts
import "../../helpers/localtest";
import t from "tap";
import { create } from "../../../web/service-a/index.js";

t.test("service-a starts correctly", async (t) => {
	const app = await create();
	await app.ready();

	t.teardown(() => app.close());

	t.ok(app.config, "config is decorated");
	t.ok(app.redis, "redis plugin is registered");

	const response = await app.inject({
		method: "GET",
		url: "/up",
	});

	t.equal(response.statusCode, 200);
});
```

### Test Directory Mirroring

The folder structure in `test/unit/service-name/` should mirror `web/service-name/`:

```
web/service-a/                    test/unit/service-a/
├── routes/                       ├── routes/
│   └── v1/                       │   └── v1/
│       └── index.ts              │       └── items.test.ts
├── helpers/                      ├── helpers/
│   └── calculator.ts             │   └── calculator.test.ts
└── plugins/                      └── plugins/
    └── auth.ts                       └── auth.test.ts
```

## Useful Commands

```bash
# Development
pnpm dev                              # Start runtime in watch mode

# Build
pnpm build                            # Build all services for production

# Testing
pnpm test                             # Run all tests (CI mode, containers via executors)

# Watt CLI
npx watt                              # Start runtime
npx watt build                        # Build runtime for deployment
npx watt resolve                      # Resolve git-based external services
```

## Best Practices

1. **Centralized tests in root**: All tests are in the `test/` folder, organized by type (unit/integration) and then by service
2. **`create()` only for integration**: Use the `create()` function only for integration tests
3. **Mirror structure**: The folder structure in `test/unit/service-name/` should mirror the structure of `web/service-name/`
4. **Service isolation**: Each service should have its own configuration and database schema
5. **External services**: Use git-resolved external services in `watt.json` for shared dependencies
6. **No `app.ready()` in `create()`**: The runtime manages the service lifecycle — calling `ready()` inside `create()` can cause issues
7. **Inter-service fetch**: Use `http://<service-id>.plt.local` for internal calls — never hardcode ports or hostnames

## Common Pitfalls

- **Calling `app.ready()` in `create()`**: The runtime calls `ready()` after all services are composed. Calling it inside `create()` bypasses inter-service wiring and may cause startup failures
- **Hardcoded service URLs**: Never use `http://localhost:PORT` for inter-service calls. Always use `http://<service-id>.plt.local` — the runtime intercepts these internally
- **Missing `env` mapping in watt.json**: If a service needs an env var, it must be mapped in the `applications[].env` block. The service won't inherit root `.env` vars automatically unless they match the same name
- **Using `create()` in unit tests**: `create()` boots the full service with all plugins and dependencies. For unit tests, build a minimal Fastify instance with only what the test needs
- **`dotenv: true` in service config**: Services inside a runtime should use `dotenv: false` — env vars are provided by the runtime via watt.json, not by a `.env` file in the service directory
