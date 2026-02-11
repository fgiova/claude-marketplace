# Claude Code Plugin Marketplace

## Project Overview

This is a **Claude Code plugin marketplace** — a repository that distributes reusable plugins/extensions for Claude Code. Plugins are installed via `/plugin marketplace add` and `/plugin install`.

## Repository Structure

```
fgiova-claude-marketplace/
├── .claude-plugin/
│   └── marketplace.json              # Central registry listing all plugins
├── plugins/
│   └── <plugin-name>/
│       ├── .claude-plugin/
│       │   └── plugin.json           # Plugin manifest
│       ├── commands/                  # Slash commands (optional)
│       │   └── <command-name>.md
│       ├── agents/                   # Agent definitions (optional)
│       │   └── <agent-name>.md
│       ├── skills/                   # Auto-activating skills (optional)
│       │   └── <skill-name>/
│       │       └── SKILL.md
│       ├── hooks/                    # Workflow hooks (optional)
│       ├── .mcp.json                 # MCP server config (optional)
│       └── README.md
└── README.md
```

## File Format Conventions

### marketplace.json (root `.claude-plugin/`)
Central plugin catalog. Each entry has: `name`, `description`, `version`, `author` (name + email), `source` (relative path), `category`.

### plugin.json (per-plugin `.claude-plugin/`)
Plugin manifest with: `name`, `description`, `version`, `author` (name + email), `repository`, `license`, `keywords`.

### Commands (`commands/<name>.md`)
Markdown files with YAML frontmatter:
```yaml
---
description: <what the command does>
argument-hint: "<usage hint>"
allowed-tools: <comma-separated list of Tool(pattern) entries>
---
```
Body contains the full prompt/instructions for the command.

### Agents (`agents/<name>.md`)
Markdown files with YAML frontmatter:
```yaml
---
name: <agent-name>
description: |
  <when to use this agent, with examples>
model: inherit
color: <color>
tools: ["Tool1", "Tool2", ...]
---
```
Body contains the agent's system instructions.

### Skills (`skills/<skill-name>/SKILL.md`)
Auto-activating skills with YAML frontmatter:
```yaml
---
name: <skill-name>
description: |
  <when to activate, with trigger keywords>
version: x.y.z
---
```
Body contains domain expertise, reference code, guidelines, and patterns.

## Existing Plugins

1. **planning-workflow** (v1.0.0, category: workflow) — Decomposes complex prompts into parallel tasks. Has commands (`plan`, `task-exec`), an agent (`task-executor`), and a skill (`prompt-decomposition`).
2. **fastify-expert** (v0.1.0, category: development) — Fastify expertise with reference TypeScript architecture. Has one skill (`fastify-expert`).

## Author Info
- Name: Francesco Giovannini
- Email: fgiova@fgiova.com
- Repository: https://github.com/fgiova/claude-marketplace
- License: MIT

## Creating a New Plugin Checklist

1. Create `plugins/<name>/` directory
2. Create `plugins/<name>/.claude-plugin/plugin.json` with manifest
3. Add commands, agents, skills, hooks as needed
4. Create `plugins/<name>/README.md`
5. Register the plugin in `.claude-plugin/marketplace.json`
6. Update root `README.md` with the new plugin entry
