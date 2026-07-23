---
name: code-implementation
description: |
  End-to-end code delivery for complex implementation work: plan, build, review, document.
  Use this skill when the user wants to actually IMPLEMENT a feature, service, or refactoring -
  not just plan it - and wants the result reviewed and documented.
  Activates for: "implement", "build", "develop", "realizza", "implementa", "sviluppa",
  "code this feature", "build and document", or any request to deliver working code with
  review and documentation.
  Runs the full pipeline: decompose into a plan, execute the tasks, run an adversarial code
  review over what was built, then write English documentation (a README.md in the project
  root and topic-split docs under docs/).
  For planning ONLY (no build), use prompt-decomposition instead.
version: 1.0.0
---

# Code Implementation

This skill delivers working, reviewed, and documented code end-to-end. It orchestrates four phases in sequence, reusing the planning-workflow agents. You (the main agent) drive the phases; delegate the heavy lifting to sub-agents.

## When This Skill Activates

The user wants to build real code and have it reviewed and documented - a feature, a service, a migration, a refactoring - not just a plan on disk.

## Pipeline

### Phase 1 - Plan & Execute

Delegate to `@planner-agent` (Agent tool). Pass the user's request and any context they gave. The agent runs the full planning workflow: resume check, decompose, persist to `.plans/`, iterate with the user, and **execute** the tasks via sub-agents.

- Ensure the plan is actually executed (not just saved). If the planner offers to defer, steer toward executing now - this skill is about delivery.
- Do NOT let the plan files be deleted at the end of Phase 1. Keep them: later phases and the docs reference what was built. If the planner asks about cleanup, keep the files until Phase 4 completes.

### Phase 2 - Adversarial Review

Run an adversarial review over the code produced in Phase 1 - the same find → refute → judge pipeline as the `/planning-workflow:adversarial-review` command:

1. Determine the target: the working + staged changes from the execution (`git diff HEAD`).
2. **Find** (parallel): spawn five `reviewer-agent` sub-agents, one per dimension (`correctness`, `security`, `performance`, `design`, `tests`), each with `ROLE: finder`.
3. **Refute** (parallel): one `reviewer-agent` with `ROLE: refuter` per finding.
4. **Judge** (parallel): one `reviewer-agent` with `ROLE: judge` per finding + refutation. Keep `confirmed`, drop `rejected`, flag `uncertain` separately (never auto-fixed).
5. Present confirmed findings, let the user select which to fix (with a challenge step), and apply the approved fixes via `@task-executor-agent`.

See the `adversarial-review` command for the full flow - do not reimplement it differently.

### Phase 3 - Documentation

Delegate to `@documenter-agent` (Agent tool). Instruct it to document what was built in Phase 1 (and adjusted in Phase 2):

- A `README.md` in the **project root** (overview, install, usage, project structure).
- Topic-split documents under **`docs/`** (one file per topic: architecture, API, configuration, testing, etc. - only the topics that apply).
- All documentation in **English**.

Pass the agent the list of files created/modified across Phases 1-2 and the plan title/goal for context.

### Phase 4 - Wrap up

Present a final summary: what was built, review outcome (confirmed/fixed/uncertain counts), and the documentation files written. Then offer to clean up the `.plans/` files (same cleanup prompt as the planning workflow).

## Rules

- Reuse the existing agents (`planner-agent`, `reviewer-agent`, `task-executor-agent`, `documenter-agent`). Do not spawn ad-hoc logic that duplicates them.
- Keep the phases in order: never document before review, never review before the code exists.
- Keep `.plans/` files until Phase 4 - the documentation phase needs the plan context.
- Never auto-fix `uncertain` review findings.
- Documentation is always in English, regardless of the conversation language.
