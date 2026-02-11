# Platformatic Runtime Plugin

Platformatic Runtime expertise for orchestrating multi-service Node.js applications with watt.json configuration, monorepo structure, and testing strategy.

## Overview

This plugin provides contextual expertise when working with Platformatic Runtime projects. It auto-activates when your prompts involve Platformatic-related topics and guides Claude to follow established Platformatic patterns and best practices.

## Skill

### platformatic-runtime

**Auto-activates** on keywords: `platformatic`, `platformatic runtime`, `plt`, `watt`, `watt.json`, `@platformatic/node`, `@platformatic/service`, `@platformatic/runtime`, `service composition`, `entrypoint`, etc.

Provides expertise in:

- **Runtime Orchestration**: Multi-service composition in a single process, entrypoint configuration, inter-service communication
- **watt.json Configuration**: Runtime and per-service configuration, environment variable interpolation, git-resolved external services
- **Monorepo Structure**: pnpm workspaces, `web/` services directory, centralized `test/`, `db/` Prisma schemas, `clients/`, `cdk/` infrastructure
- **Service Entry Point**: The `create()` function pattern for Platformatic Node services
- **Testing Strategy**: Unit tests with minimal Fastify instances vs integration tests with `create()`, Testcontainers for external dependencies
- **Best Practices**: Centralized tests, mirror folder structure, service isolation, external service resolution

## Reference Architecture

The skill includes a complete reference project structure covering:
- `watt.json` / `watt.production.json` — Runtime configuration
- `web/<service>/index.ts` — Service entry point with `create()`
- `web/<service>/config.ts` — Environment configuration
- `web/<service>/plugins/`, `routes/`, `graphql/`, `helpers/`, `types/`
- `test/unit/`, `test/integration/` — Centralized test organization
- `db/<service>/schema.prisma` — Per-service Prisma schemas

## Installation

```bash
/plugin marketplace add /path/to/fgiova-claude-marketplace
/plugin install platformatic-runtime@fgiova-claude-marketplace
```

## Usage

The skill activates automatically when you work on Platformatic projects. Examples:

```
"Create a new Platformatic service for user management"
"Configure watt.json for a new service"
"Add an external git-resolved service"
"Write unit tests for this route handler"
```

## License

MIT
