---
description: Adversarial code review - find, refute, judge findings across parallel agents, then apply fixes selectively
argument-hint: "[branch] (empty = working + staged changes)"
allowed-tools: Read(*), Write(*), Edit(*), Glob(*), Grep(*), Bash(*), AskUserQuestion(*), Task(*)
---

## Adversarial Code Review

You orchestrate adversarial code review. Finding must survive refute + judge before reach user. False positive die on way.

### Input

Optional branch: `$ARGUMENTS`

### Step 1 - Resolve the target diff

Base branch: `main` if `git rev-parse --verify main` succeed, else `master`.

- **No `$ARGUMENTS`** → review **working + staged**: `git diff HEAD`. OK on any branch, incl main/master.
- **`$ARGUMENTS` is branch** (verify `git rev-parse --verify "$ARGUMENTS"`) → review branch commits: `git diff <base>...<ARGUMENTS>`.
  - `$ARGUMENTS` equal base branch → stop: "Niente da revisionare: il branch coincide con la base."
- **Guard**: branch mode resolve to `main`/`master` (e.g. current branch main, passed explicit) → stop, tell user pass feature branch, or run no-arg for working/staged.

Capture diff + changed file list. Diff empty → tell user nothing to review, stop.

### Step 2 - Find (parallel)

Launch **five `reviewer-agent` sub-agents parallel**, one per dimension: `correctness`, `security`, `performance`, `design`, `tests`.

Each agent prompt hold:
```
ROLE: finder
DIMENSION: <dimension>
<the diff + changed file paths>
```

Collect all finding one list. Assign stable id (`SEC-1`, `BUG-2`, ...). Zero finding all dimension → report clean bill, stop.

### Step 3 - Refute (parallel)

**Each** finding, launch `reviewer-agent` parallel:
```
ROLE: refuter
<the finding, verbatim>
<the diff + changed file paths>
```

Pair every finding with refutation.

### Step 4 - Judge (parallel)

**Each** finding+refutation pair, launch `reviewer-agent` parallel:
```
ROLE: judge
FINDING: <the finding>
REFUTATION: <the refutation>
<the diff + changed file paths>
```

Partition by verdict:
- `confirmed` → survive, go to report
- `rejected` → drop (keep count)
- `uncertain` → report separate section, **never auto-fix**

### Step 5 - Report

Present to user:
- **Confirmed findings**, group by severity (critical → low). Each: id, `file:line`, claim, suggested fix, final severity.
- **Uncertain findings** separate section (flagged, not auto-actionable).
- One-line tally: `N confirmed, M uncertain, K rejected (of T total found)`.

No confirmed + no uncertain → say diff passed adversarial review, stop.

### Step 6 - Selective fix decision

Use `AskUserQuestion` (multiSelect) listing each **confirmed** finding by id + short claim. User pick which fix. Include **"Nessuno"** option. Uncertain not offered here.

### Step 7 - Challenge before executing

Before apply anything, show user exact set of selected fixes, ask (`AskUserQuestion`): **Applica** / **Contesta un fix** / **Annulla**.

- **Contesta**: user name fix, give counter-argument. Re-run `reviewer-agent` (`ROLE: judge`) on that finding with user challenge as new evidence. Verdict flip to `rejected` → drop fix; else keep. Return to this step.
- **Annulla**: skip all fix, end with report.
- **Applica**: proceed step 8 with confirmed selection.

### Step 8 - Apply fixes

Each selected fix, launch `@task-executor-agent` sub-agent (parallel when fix touch different file; sequential when same file). Pass finding `file:line`, claim, `suggested_fix` as task.

Collect result, present final summary: which fix applied, which file changed, any failed.

### Rules

- Never present finding not passed refute + judge.
- Never auto-fix `uncertain`.
- All find/refute/judge agent analysis-only (`reviewer-agent`); only fix apply (`task-executor-agent`) may modify file.
- Run each phase agents parallel - this the point of workflow.
- Keep finding id stable across all phase so user track them.