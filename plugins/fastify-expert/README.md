# Fastify Expert Plugin

Senior Fastify developer expertise for building high-performance, type-safe Node.js APIs.

## Overview

This plugin provides contextual expertise when working with Fastify projects. It auto-activates when your prompts involve Fastify-related topics and guides Claude to follow established Fastify patterns and best practices.

## Skill

### fastify-expert

**Auto-activates** on keywords: `fastify`, `route handler`, `schema validation`, `typebox`, `fastify plugin`, `openapi`, `pino`, `autoload`, etc.

Provides expertise in:

- **Plugin Architecture**: Reusable plugins with `fastify-plugin`, encapsulation, dependency injection, `@fastify/autoload`
- **Schema Validation**: JSON Schema with TypeBox, request/response validation, serialization
- **TypeScript Integration**: Type-safe routing with `@fastify/type-provider-typebox`, schema inference, generic patterns
- **Project Structure**: Config with `env-schema`, Sentry integration, graceful shutdown with `close-with-grace`
- **OpenAPI/Swagger**: `@fastify/swagger` + `@fastify/swagger-ui` plugin setup
- **Type-Safe Routes**: Route handlers with TypeBox type provider, proper schema definitions
- **Ecosystem**: Redis, Pino logging, Docker deployment, production configuration
- **Code Quality**: TypeScript strict mode, comprehensive testing, consistent error handling

## Reference Architecture

The skill includes a complete reference implementation covering:
- `src/config.ts` - TypeBox-based env configuration
- `src/sentry.ts` - Sentry error tracking setup
- `src/server.ts` - Server bootstrap with graceful shutdown
- `src/index.ts` - App entry with autoload for plugins and routes
- `src/types/` - Shared TypeBox schemas with type inference
- `src/plugins/` - Plugin examples (OpenAPI)
- `src/routes/` - Type-safe route handlers
- `Dockerfile`, `tsconfig.json`, `package.json` - Production-ready configs

## Installation

```bash
/plugin marketplace add /path/to/fgiova-claude-marketplace
/plugin install fastify-expert@fgiova-claude-marketplace
```

## Usage

The skill activates automatically when you work on Fastify projects. Examples:

```
"Create a new Fastify route for user registration"
"Add a plugin for database connection"
"Set up schema validation for this endpoint"
"Configure OpenAPI docs for the API"
```

## License

MIT
