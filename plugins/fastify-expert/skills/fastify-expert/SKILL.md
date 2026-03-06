---
name: fastify-expert
description: |
  ALWAYS consult this skill when the user mentions Fastify, builds Node.js APIs, creates routes
  or plugins, uses TypeBox/typebox for schema validation, configures env-schema, sets up
  OpenAPI/Swagger, or works on any Fastify-based backend — even for seemingly simple questions.
  This skill contains critical reference architecture, TypeScript patterns, and production-ready
  code templates that Claude cannot generate correctly without consulting.
  Covers: plugin architecture with fp(), decorators, schema validation, project structure,
  configuration, graceful shutdown, Dockerfile, autoload, Redis integration, Sentry setup.
  Does NOT cover test code (see fastify-testing) or container infrastructure (see tap-testcontainers).
  Trigger on ANY mention of: fastify, fastify plugin, route, schema, typebox, decorator,
  fp(), pino, autoload, close-with-grace, env-schema, @fastify/*, swagger, openapi,
  Node.js API, REST API, microservice backend, Fastify instance, server.ts, config.ts.
version: 0.1.0
---

# Fastify Expert

You are a senior Fastify developer with expertise in building high-performance, type-safe Node.js APIs. You specialize in Fastify's plugin architecture, schema validation, and performance optimization patterns.

## Core Expertise

### Fastify Framework Mastery
- **Plugin Architecture**: Creating reusable plugins, encapsulation, dependency injection
- **Schema Validation**: JSON Schema, request/response validation, serialization
- **TypeScript Integration**: Type-safe routing, schema inference, generic patterns
- **Async Patterns**: Modern async/await, streaming, backpressure handling

### Advanced Features
- **Deployment**: Production optimization, clustering, monitoring

### Ecosystem Integration
- **Validation**: Ajv, Typebox, env-schema, custom validators
- **Logging and Monitoring**: Pino, Sentry
- **Caching**: Redis, in-memory caching with lru-cache
- **Documentation**: Swagger/OpenAPI integration, automated docs
- **Cloud Native**: Docker, Kubernetes, serverless deployment patterns

## Modern Fastify Application Architecture

### Project Structure

```
src/
├── config.ts          # Application configuration (env-schema + typebox)
├── sentry.ts          # Sentry error tracking setup
├── server.ts          # Server bootstrap and graceful shutdown
├── index.ts           # Main app entry point (plugin/route registration)
├── types/
│   └── index.ts       # Shared TypeBox schemas and inferred types
├── plugins/
│   └── open-api/
│       └── index.ts   # OpenAPI/Swagger plugin
└── routes/
    ├── index.ts       # Health check route (/up)
    └── v1/
        └── index.ts   # API v1 routes
```

### Application Configuration

`src/config.ts` — type-safe configuration using `env-schema` and `typebox`:
```typescript
import { type Static, Type } from "typebox";
import { envSchema } from "env-schema";

const ConfigSchema = Type.Object({
	PORT: Type.Number({ default: 3000 }),
	APP_NAME: Type.String({ default: "application" }),
	APP_ENV: Type.String({
		default: "dev",
		examples: ["dev", "production", "test"],
	}),
	SENTRY_DSN: Type.Optional(Type.String()),
	REDIS_URL: Type.String({ default: "redis://localhost:6379" }),
	EXTERNAL_SERVICE_URL: Type.String({ default: "https://example.local/api" }),
});

const config = envSchema<Static<typeof ConfigSchema>>({
	schema: ConfigSchema,
	dotenv: { path: ".env" },
});

const configExport = {
	port: config.PORT,
	env: config.APP_ENV,
	sentryDsn: config.SENTRY_DSN,
	redis: {
		url: config.REDIS_URL,
	},
	urls: {
		externalService: config.EXTERNAL_SERVICE_URL,
	},
};

export type ConfigType = typeof configExport;
export default configExport;
```

### Sentry Integration

`src/sentry.ts`:
```typescript
import { init } from "@sentry/node";
import packageJsonFinder from "find-package-json";
import config from "./config.js";

if (config.sentryDsn) {
	const packageJson = packageJsonFinder().next().value;
	init({
		dsn: config.sentryDsn,
		environment: config.env,
		tracesSampleRate: 1.0,
		release: packageJson?.version,
	});
}
```

### Server Bootstrap

`src/server.ts` — startup with graceful shutdown via `close-with-grace`:
```typescript
import "./sentry.js";
import closeWithGrace from "close-with-grace";
import config from "./config.js";
import app from "./index.js";

const start = async () => {
	try {
		const fastify = await app(config);

		const address = await fastify.listen({
			port: config.port,
			host: "0.0.0.0",
		});

		fastify.log.info(`server listening on ${address}`);

		closeWithGrace(async ({ signal, err }) => {
			if (err) {
				fastify.log.error({ err }, "server closing with error");
			} else {
				fastify.log.info(`${signal} received, server closing`);
			}
			await fastify.close();
		});
	} catch (err) {
		console.error("Error starting server:", err);
		process.exit(1);
	}
};

start().then(() => void 0);
```

### Main Application Entry Point

`src/index.ts` — plugin registration, autoload, and config decorator:
```typescript
import path from "node:path";
import autoload from "@fastify/autoload";
import fastifyRedis from "@fastify/redis";
import { setupFastifyErrorHandler } from "@sentry/node";
import fastify, { type FastifyInstance } from "fastify";
import type { ConfigType } from "./config.js";

declare module "fastify" {
	export interface FastifyInstance {
		config: ConfigType;
	}
}

const startServer = async (config: ConfigType): Promise<FastifyInstance> => {
	const app = fastify({
		logger: true,
	});

	/* c8 ignore next 3 */
	if (config.sentryDsn) {
		setupFastifyErrorHandler(app);
	}

	app.decorate("config", config);

	await app.register(fastifyRedis, config.redis);

	await app.register(autoload, {
		dir: path.resolve(import.meta.dirname, "./plugins"),
		options: {
			...config,
		},
	});

	await app.register(autoload, {
		dir: path.resolve(import.meta.dirname, "./routes"),
	});

	await app.ready();
	return app;
};

export default startServer;
```

### Shared TypeBox Schemas

`src/types/index.ts` — define schemas once, infer TypeScript types:
```typescript
import { Type, Static } from "typebox";

export const Success = Type.Object({
	success: Type.Boolean({ default: true }),
	message: Type.Optional(Type.String()),
});

export const Test = Type.Object({
	test: Type.String(),
});

export type Success = Static<typeof Success>;
export type Test = Static<typeof Test>;
```

### Plugin-Based Architecture

`src/plugins/open-api/index.ts` — OpenAPI/Swagger plugin wrapped with `fastify-plugin`:
```typescript
import fastifySwagger, { type SwaggerOptions } from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

const openApi = (
	fastify: FastifyInstance,
	// biome-ignore lint/suspicious/noExplicitAny: not important here
	options: Record<string, any>,
	next: (err?: Error) => void,
) => {
	const defaults: SwaggerOptions = {
		mode: "dynamic",
		openapi: {
			info: {
				title: "OpenApi for Microservice", // set your title
				description: "fastify swagger api", // set your description
				version: "0.0.0",
			},
			servers: [
				{
					url: options.baseURL || `http://localhost:${options.port}`,
				},
			],
		},
		hideUntagged: true,
	};
	const config = Object.assign({}, defaults, options) as SwaggerOptions;
	fastify.register(fastifySwagger, config);
	fastify.register(fastifySwaggerUi, {
		routePrefix: "/open-api",
	});
	next();
};

export default fp(openApi, {
	name: "openapi-documentation",
	fastify: ">=5.x",
});
```

### Type-Safe Route Handlers

`src/routes/index.ts` — health check route:
```typescript
/* c8 ignore start */
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type { FastifyInstance, FastifyServerOptions } from "fastify";
import { Success } from "../types/index.js";

export default function (
	fastifyInstance: FastifyInstance,
	_options: FastifyServerOptions,
	done: (err?: Error) => void,
) {
	const fastify = fastifyInstance.withTypeProvider<TypeBoxTypeProvider>();

	fastify.get(
		"/up",
		{
			logLevel: "silent",
			schema: {
				response: {
					200: Success,
				},
			},
		},
		async (request, reply) => {
			reply.send({
				success: true,
			});
		},
	);

	done();
}
/* c8 ignore stop */
```

`src/routes/v1/index.ts` — API route with external service call:
```typescript
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type { FastifyInstance, FastifyServerOptions } from "fastify";
import { Success, Test } from "../../types/index.js";
import { request as undiciRequest } from "undici";

export default function (
	_fastify: FastifyInstance,
	options: FastifyServerOptions,
	done: (err?: Error) => void,
) {
	const fastify = _fastify.withTypeProvider<TypeBoxTypeProvider>();
	fastify.post(
		"/",
		{
			schema: {
				tags: ["v1"],
				body: Test,
				response: {
					200: Success,
				},
			},
		},
		async (request, reply) => {
			const test = request.body.test;

			const remoteResult = await undiciRequest(
				fastify.config.urls.externalService,
				{
					method: "POST",
					body: JSON.stringify({ test }),
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (remoteResult.statusCode !== 200) {
				return reply.status(502).send({
					success: false,
					message: "Failed to reach remote service",
				});
			}

			reply.send({
				success: true,
			});
		},
	);

	done();
}
```

### Dockerfile Example

```Dockerfile
FROM node:22-alpine

LABEL maintainer="Coverzen <dev@coverzen.it>"
WORKDIR /home/app
COPY package*.json ./
COPY node_modules ./node_modules
COPY dist ./
RUN npm prune --omit dev
CMD [ "node", "./server.js" ]
```

### Package.json Scripts and Configuration
```json
{
  "scripts": {
	"clean": "rm -rf ./dist",
	"build": "tsc",
	"dev": "node --watch --watch-path=./src --import tsx src/server.ts"
  },
  "tap": {
	"show-full-coverage": true
  },
  "engines": {
	"node": ">=22.0.0"
  }
}
```

### Tsconfig.json Example
```json
{
  "extends": "@tsconfig/node22/tsconfig.json",
  "compilerOptions": {
	"outDir": "./dist",
	"rootDirs": [
	  "./src"
	],
	"declaration": false,
	"resolveJsonModule": true,
	"noUnusedLocals": true,
	"module": "node16",
	"esModuleInterop": true,
	"allowSyntheticDefaultImports": true
  },
  "exclude": [
	"node_modules",
	"dist"
  ],
  "include": [
	"src",
	"./@types"
  ]
}
```

## Code Quality Standards

- Use TypeScript strictly with comprehensive type safety
- Implement schema validation for all requests and responses
- Follow plugin-based architecture for modularity and reusability
- Use proper error handling with consistent error responses
- Implement comprehensive testing with unit tests
- Implement graceful shutdown and resource cleanup
- Document APIs with OpenAPI/Swagger integration

Always prioritize performance, type safety, and maintainability while leveraging Fastify's strengths in speed and developer experience.

## Common Pitfalls

- **Import shadowing in route handlers**: If you import a function (e.g. `request` from `undici`) and the route handler parameter has the same name, the handler parameter wins. Rename the import (e.g. `import { request as undiciRequest }`)
- **Missing `declare module "fastify"`**: When decorating the instance (e.g. `app.decorate("config", config)`), always augment the `FastifyInstance` interface — otherwise TypeScript won't see the property
- **Forgetting `fp()` wrapper**: Plugins that should share their decorations across the app must be wrapped with `fastify-plugin` (`fp()`). Without it, decorators are encapsulated and invisible to sibling routes/plugins
- **Calling `done()` in async plugin functions**: If your plugin registration function is `async`, do NOT call `done()` — Fastify handles the callback automatically. Mixing both causes double-callback errors
- **Schema response keys as strings**: Response schema keys must be numeric status codes (`200`, `404`), not strings. TypeBox schemas go directly as values — no `{ type: "object" }` wrapper needed
