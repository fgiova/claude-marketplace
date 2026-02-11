# Planning Workflow Plugin

Plan and execute complex prompts by decomposing them into structured, parallel tasks.

## Overview

This plugin helps you tackle complex, multi-step tasks by:
1. Bootstrapping a `.plans/` directory (auto-added to `.gitignore`)
2. Decomposing a complex prompt into atomic tasks with dependencies
3. Presenting an interactive plan for review and approval
4. Saving each task as a separate file for independent tracking
5. Optionally executing tasks immediately or deferring to later
6. Executing tasks in parallel phases using sub-agents
7. Updating the plan index in real-time after every task completion
8. Presenting a final summary and offering cleanup of planning files

## Commands

### `/planning-workflow:plan <prompt>`

Full planning-to-execution workflow in a single command.

**Planning phase:**
- Bootstraps `.plans/` directory and ensures it's in `.gitignore`
- Analyzes the prompt and breaks it into atomic, executable tasks
- Maps dependencies between tasks and groups independent ones into parallel phases
- Presents the plan interactively for approval/modification
- Saves the approved plan as a directory structure:
  ```
  .plans/<timestamp>-<slug>/
  ├── plan.md              # Plan index with status table per phase
  └── tasks/
      ├── task-1.1.md      # Individual task file with frontmatter
      ├── task-1.2.md
      └── task-2.1.md
  ```

**Execution phase (optional):**
- After saving, asks whether to execute immediately or defer
- If executing: runs the full execution flow (same as `task-exec`)
- After completion: presents a detailed summary and asks whether to delete or keep planning files

### `/planning-workflow:task-exec [plan-directory]`

Executes tasks from a previously saved plan.

- Reads the plan directory (or the most recent one in `.plans/`)
- Discovers task files and loads metadata (phase, status, agent, dependencies)
- Launches parallel sub-agents for independent tasks within each phase
- Updates each task file and the plan index after **every single task completion**
- Handles failures with retry/skip/abort options
- Presents a detailed final summary with per-task results and files modified
- Asks whether to delete or keep the planning files

## Plan File Structure

### Plan index (`plan.md`)

```markdown
---
title: Refactor Auth System
created: 2025-01-15T10:30:00Z
status: approved | in-progress | completed | partial
total-tasks: 5
phases: 3
completed-tasks: 0
failed-tasks: 0
---

# Refactor Auth System

## Phase 1: Research
**Execution**: parallel

| Task | Title | Status |
|------|-------|--------|
| [1.1](tasks/task-1.1.md) | Analyze current auth flow | pending |
| [1.2](tasks/task-1.2.md) | Review JWT libraries | pending |
```

### Task file (`tasks/task-1.1.md`)

```markdown
---
id: "1.1"
title: Analyze current auth flow
phase: 1
status: pending
agent: general-purpose
dependencies: []
created: 2025-01-15T10:30:00Z
---

# Task 1.1: Analyze current auth flow

## Description
Read and document the current authentication middleware...

## Expected Outcome
A clear understanding of the existing auth flow...

## Context
- src/middleware/auth.ts
- src/routes/login.ts
```

## Agent

### task-executor
Specialized agent for executing a single task from a plan. Receives the full task file content as a prompt and executes it autonomously, returning:
- Files created or modified
- Key decisions made
- Issues encountered
- Verification results

## Skill

### prompt-decomposition
Best practices for breaking down complex prompts into atomic tasks:
- **Atomicity**: each task does exactly one thing
- **Independence**: maximize tasks that can run in parallel
- **Clarity**: unambiguous descriptions with specific file paths and expected outcomes
- **Completeness**: the full set of tasks covers the original prompt
- Dependency mapping strategies (data, order, resource dependencies)
- Phase organization patterns (research, implementation, integration, verification)
- Common decomposition patterns for features, refactoring, and bug fixes

## Installation

```bash
/plugin marketplace add /path/to/fgiova-claude-marketplace
/plugin install planning-workflow@fgiova-claude-marketplace
```

## Usage

```bash
# Create a plan and optionally execute it immediately
/planning-workflow:plan "Refactor the authentication system to use JWT tokens, add refresh token support, update all API endpoints, and write integration tests"

# Or execute a previously saved plan
/planning-workflow:task-exec .plans/2025-01-15-refactor-auth/
```

## How It Works

1. **Bootstrap**: ensures `.plans/` exists and is git-ignored
2. **Decompose**: breaks the prompt into atomic tasks with dependencies
3. **Review**: presents the plan interactively, iterates until approved
4. **Save**: writes `plan.md` index + one file per task in `tasks/`
5. **Execute** (now or later): launches parallel sub-agents per phase
6. **Track**: updates task files and plan index after every completion
7. **Report**: detailed summary with per-task results and modified files
8. **Cleanup**: optionally deletes all planning files

## License

MIT
