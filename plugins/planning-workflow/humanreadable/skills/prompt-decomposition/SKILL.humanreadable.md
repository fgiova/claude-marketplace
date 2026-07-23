---
name: prompt-decomposition
description: |
  Structured planning and task decomposition for complex, multi-step work.
  Use this skill whenever the user needs to break a large task into smaller parts,
  create an implementation plan, organize a migration, or structure a refactoring.
  Activates for: planning complex features, migrating architectures, refactoring
  codebases, organizing multi-service work, or any request that involves multiple
  phases of coordinated implementation. Also handles resuming or suspending
  previously saved plans.
  Without this skill, complex requests are executed monolithically instead of being
  decomposed into atomic, parallelizable sub-tasks with dependency tracking.
version: 1.2.0
agent: planner-agent
---

# Prompt Decomposition

This skill orchestrates structured task decomposition by delegating the planning workflow to the `@planner-agent`.

## When This Skill Activates

This skill activates when the user wants to:
- Plan a complex feature, migration, or refactoring
- Break down a large task into atomic, parallelizable sub-tasks
- Create a structured execution plan with phases and dependencies
- Resume or review an existing plan from a previous session
- Suspend a plan in progress for later continuation

## Execution

When activated, **immediately delegate to the `@planner-agent`** using the Agent tool. The agent handles the full planning workflow autonomously:

1. **Resume Check** — Look for existing `.plans/*/plan.md` files to resume
2. **Analyze** — Understand scope, read referenced files
3. **Decompose** — Break into atomic tasks with dependency mapping
4. **Organize** — Group into parallel phases, avoid file conflicts
5. **Persist** — Save plan to `.plans/` before presenting
6. **Iterate** — Review with user, apply modifications
7. **Execute** — Run tasks via sub-agents when approved

### How to Delegate

Use the Agent tool with `@planner-agent` and pass the user's request as the prompt. Include any relevant context the user has already provided:

- If the user specified a project or goal, include it
- If the user referenced files or codebase areas, mention them
- If the user wants to resume a plan, pass that along

**Example delegation prompt:**
> "The user wants to plan [topic]. They mentioned [any context]. Follow the full planning workflow."

### What NOT to Do

- Do NOT execute the planning workflow yourself — the agent handles it
- Do NOT ask preliminary questions before delegating — the agent will handle the interaction
- Do NOT post-process the agent's output — it manages the plan lifecycle directly with the user
