---
name: code-implementation
description: |
  End-to-end code delivery for complex implementation work: plan, build, review, document.
  Use when user want to actually IMPLEMENT feature, service, or refactoring -
  not just plan - and want result reviewed and documented.
  Activates for: "implement", "build", "develop", "realizza", "implementa", "sviluppa",
  "code this feature", "build and document", or any request to deliver working code with
  review and documentation.
  Runs full pipeline: decompose into plan, execute tasks, run adversarial code
  review over what built, then write English docs (README.md in project
  root and topic-split docs under docs/).
  Planning ONLY (no build): use prompt-decomposition instead.
version: 1.0.0
---

# Code Implementation

Skill deliver working, reviewed, documented code end-to-end. Orchestrates four phases in sequence, reusing planning-workflow agents. You (main agent) drive phases; delegate heavy lifting to sub-agents.

## When This Skill Activates

User want build real code, reviewed + documented - feature, service, migration, refactoring - not just plan on disk.

## Pipeline

### Phase 1 - Plan & Execute

Delegate to `@planner-agent` (Agent tool). Pass user request + any context given. Agent runs full planning workflow: resume check, decompose, persist to `.plans/`, iterate with user, and **execute** tasks via sub-agents.

- Ensure plan actually executed (not just saved). If planner offer to defer, steer toward executing now - this skill about delivery.
- Do NOT let plan files deleted at end of Phase 1. Keep them: later phases + docs reference what built. If planner ask about cleanup, keep files until Phase 4 done.

### Phase 2 - Adversarial Review

Run adversarial review over code from Phase 1 - same find → refute → judge pipeline as `/planning-workflow:adversarial-review` command:

1. Determine target: working + staged changes from execution (`git diff HEAD`).
2. **Find** (parallel): spawn five `reviewer-agent` sub-agents, one per dimension (`correctness`, `security`, `performance`, `design`, `tests`), each with `ROLE: finder`.
3. **Refute** (parallel): one `reviewer-agent` with `ROLE: refuter` per finding.
4. **Judge** (parallel): one `reviewer-agent` with `ROLE: judge` per finding + refutation. Keep `confirmed`, drop `rejected`, flag `uncertain` separately (never auto-fixed).
5. Present confirmed findings, let user select which to fix (with challenge step), apply approved fixes via `@task-executor-agent`.

See `adversarial-review` command for full flow - do not reimplement differently.

### Phase 3 - Documentation

Delegate to `@documenter-agent` (Agent tool). Instruct it to document what built in Phase 1 (+ adjusted in Phase 2):

- `README.md` in **project root** (overview, install, usage, project structure).
- Topic-split docs under **`docs/`** (one file per topic: architecture, API, configuration, testing, etc. - only topics that apply).
- All docs in **English**.

Pass agent list of files created/modified across Phases 1-2 + plan title/goal for context.

### Phase 4 - Wrap up

Present final summary: what built, review outcome (confirmed/fixed/uncertain counts), doc files written. Then offer cleanup of `.plans/` files (same cleanup prompt as planning workflow).

## Rules

- Reuse existing agents (`planner-agent`, `reviewer-agent`, `task-executor-agent`, `documenter-agent`). No ad-hoc logic duplicating them.
- Keep phases in order: never document before review, never review before code exists.
- Keep `.plans/` files until Phase 4 - doc phase need plan context.
- Never auto-fix `uncertain` review findings.
- Docs always English, regardless of conversation language.