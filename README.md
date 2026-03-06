# Fgiova Claude Marketplace

A curated marketplace for Claude Code plugins and extensions.

## About

This marketplace distributes high-quality Claude Code plugins that extend Claude Code with:
- Slash commands for quick actions
- Autonomous agents for complex tasks
- Contextual skills for domain expertise
- Hooks for workflow automation
- MCP server integrations

## Available Plugins

- [**planning-workflow**](plugins/planning-workflow/README.md) - Plan and execute complex prompts with parallel task decomposition. Auto-activates when you ask to plan, decompose, or structure a task.
- [**fastify-expert**](plugins/fastify-expert/README.md) - Senior Fastify developer expertise: type-safe APIs, plugin architecture, schema validation, and production patterns. Auto-activates on Fastify-related prompts.
- [**fastify-testing**](plugins/fastify-testing/README.md) - Fastify testing expertise with node-tap: unit tests, integration tests, route testing, plugin testing, and best practices.
- [**platformatic-runtime**](plugins/platformatic-runtime/README.md) - Platformatic Runtime expertise: multi-service orchestration, watt.json configuration, monorepo structure, and testing strategy. Auto-activates on Platformatic-related prompts.
- [**tap-testcontainers**](plugins/tap-testcontainers/README.md) - Node-tap and Testcontainers integration expertise: container-based testing, test lifecycle, service orchestration, and best practices for Node.js. Auto-activates on node-tap + Testcontainers-related prompts.
- [**localstack-expert**](plugins/localstack-expert/README.md) - LocalStack Community Edition expertise: local AWS development, docker-compose setup, cdklocal/awslocal tooling, init hooks, and service configuration. Auto-activates on LocalStack-related prompts.
- [**prompt-engineer**](plugins/prompt-engineer/README.md) - Structured prompt engineering: guides you through a 6-phase framework (Task, Context, Reference, Brief, Rules, Conversation) to build professional-grade, reusable prompts. Use `/prompt-engineer` or ask to "build a prompt".

## Getting Started

### Add Marketplace
```bash
/plugin marketplace add https://github.com/fgiova/claude-marketplace
```

Or locally:
```bash
/plugin marketplace add /path/to/fgiova-claude-marketplace
```

### Install Plugins
```bash
/plugin install planning-workflow@fgiova-claude-marketplace
```

### Update Marketplace
```bash
/plugin marketplace update
```

## Creating Plugins

Each plugin lives under `plugins/` and must contain a `.claude-plugin/plugin.json` manifest.

### Plugin Structure
```
plugins/my-plugin/
├── .claude-plugin/
│   └── plugin.json
├── commands/
├── agents/
├── skills/
├── hooks/
├── .mcp.json
└── README.md
```

## Repository Structure

```
.
├── .claude-plugin/
│   └── marketplace.json
├── plugins/
│   └── planning-workflow/
│       ├── .claude-plugin/plugin.json
│       ├── commands/
│       ├── agents/
│       ├── skills/
│       └── README.md
└── README.md
```

## License

MIT
