---
description: Adversarial code review - find, refute, judge findings across parallel agents, then apply fixes selectively
argument-hint: "[branch] (empty = working + staged changes)"
allowed-tools: Read(*), Write(*), Edit(*), Glob(*), Grep(*), Bash(*), AskUserQuestion(*), Task(*)
---

## Adversarial Code Review

You orchestrate an adversarial code review. Findings must survive a refutation and a judgment before they reach the user. False positives get killed on the way.

### Input

Optional branch: `$ARGUMENTS`

### Step 1 - Resolve the target diff

Determine the base branch: use `main` if `git rev-parse --verify main` succeeds, else `master`.

- **No `$ARGUMENTS`** → review **working + staged** changes: `git diff HEAD`. Allowed on any branch, including main/master.
- **`$ARGUMENTS` is a branch** (verify with `git rev-parse --verify "$ARGUMENTS"`) → review the branch's commits: `git diff <base>...<ARGUMENTS>`.
  - If `$ARGUMENTS` equals the base branch → stop: "Niente da revisionare: il branch coincide con la base."
- **Guard**: if branch mode resolves to `main`/`master` (e.g. current branch is main and passed explicitly) → stop and tell the user to pass a feature branch, or run with no argument to review working/staged changes.

Capture the diff and the list of changed files. If the diff is empty → tell the user there is nothing to review and stop.

### Step 2 - Find (parallel)

Launch **five `reviewer-agent` sub-agents in parallel**, one per dimension: `correctness`, `security`, `performance`, `design`, `tests`.

Each agent prompt contains:
```
ROLE: finder
DIMENSION: <dimension>
<the diff + changed file paths>
```

Collect all findings into one list. Assign stable ids (`SEC-1`, `BUG-2`, ...). If zero findings across all dimensions → report a clean bill of health and stop.

### Step 3 - Refute (parallel)

For **each** finding, launch a `reviewer-agent` in parallel:
```
ROLE: refuter
<the finding, verbatim>
<the diff + changed file paths>
```

Pair every finding with its refutation.

### Step 4 - Judge (parallel)

For **each** finding+refutation pair, launch a `reviewer-agent` in parallel:
```
ROLE: judge
FINDING: <the finding>
REFUTATION: <the refutation>
<the diff + changed file paths>
```

Partition by verdict:
- `confirmed` → survives, goes to the report
- `rejected` → dropped (keep a count)
- `uncertain` → reported in a separate section, **never auto-fixed**

### Step 5 - Report

Present to the user:
- **Confirmed findings**, grouped by severity (critical → low). Each: id, `file:line`, claim, suggested fix, final severity.
- **Uncertain findings** in a separate section (flagged, not actionable automatically).
- A one-line tally: `N confirmed, M uncertain, K rejected (of T total found)`.

If there are no confirmed and no uncertain findings → say the diff passed adversarial review and stop.

### Step 6 - Selective fix decision

Use `AskUserQuestion` (multiSelect) listing each **confirmed** finding by id + short claim. Let the user pick which to fix. Include a **"Nessuno"** option. Uncertain findings are not offered here.

### Step 7 - Challenge before executing

Before applying anything, show the user the exact set of fixes they selected and ask (`AskUserQuestion`): **Applica** / **Contesta un fix** / **Annulla**.

- **Contesta**: the user names a fix and gives a counter-argument. Re-run a `reviewer-agent` (`ROLE: judge`) on that finding with the user's challenge added as new evidence. If the verdict flips to `rejected`, drop that fix; otherwise keep it. Then return to this step.
- **Annulla**: skip all fixes, end with the report.
- **Applica**: proceed to step 8 with the confirmed selection.

### Step 8 - Apply fixes

For each selected fix, launch a `@task-executor-agent` sub-agent (parallel when the fixes touch different files; sequential when they touch the same file). Pass the finding's `file:line`, claim, and `suggested_fix` as the task.

Collect results and present a final summary: which fixes were applied, which files changed, any that failed.

### Rules

- Never present a finding that has not passed refute + judge.
- Never auto-fix `uncertain` findings.
- All find/refute/judge agents are analysis-only (`reviewer-agent`); only fix application (`task-executor-agent`) may modify files.
- Run each phase's agents in parallel - this is the point of the workflow.
- Keep finding ids stable across all phases so the user can track them.
