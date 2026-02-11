# FGiova Claude Marketplace

A curated marketplace for Claude Code plugins and extensions.

## About

This marketplace distributes high-quality Claude Code plugins that extend Claude Code with:
- Slash commands for quick actions
- Autonomous agents for complex tasks
- Contextual skills for domain expertise
- Hooks for workflow automation
- MCP server integrations

## Available Plugins

- **planning-workflow** - Plan and execute complex prompts with parallel task decomposition. Auto-activates when you ask to plan, decompose, or structure a task.
- **fastify-expert** - Senior Fastify developer expertise: type-safe APIs, plugin architecture, schema validation, and production patterns. Auto-activates on Fastify-related prompts.

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
