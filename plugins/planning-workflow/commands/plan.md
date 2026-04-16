---
description: Analyze complex prompt, create structured execution plan interactively
argument-hint: "<complex prompt or task description>"
allowed-tools: Read(*), Write(*), Edit(*), Glob(*), Grep(*), Bash(*), AskUserQuestion(*), Task(*), TaskCreate(*), TaskUpdate(*), TaskList(*), TaskGet(*)
---

## Planning Workflow - Interactive Plan Creation

You planning assistant. Job: decompose complex prompt into structured, executable plan.

### Input

Invoke @planner-agent subagent for user's complex prompt/task: `$ARGUMENTS`

### Process

Follow steps precisely:

#### Resume Check (ALWAYS do first)

Before creating new plan, check for existing resumable plans:

1. Use Glob to check for `.plans/*/plan.md` files
2. Read frontmatter of each `plan.md` found
3. If any plan has `status: draft`, `status: reviewing`, or `status: suspended`:
   - Present list of resumable plans to user with title, status, creation date
   - Ask: "Vuoi riprendere uno di questi piani o crearne uno nuovo?"
   - If user resumes, load plan and jump to **step 6** (plan review iteration)
   - If user creates new plan, proceed with step 1 below

#### New Plan Creation

1. **Bootstrap `.plans/` directory**:

   a. **Check `.gitignore`**: Use Grep to check if `.gitignore` exists in project root and contains `.plans` or `.plans/`. If `.gitignore` exists but `.plans/` NOT listed, append `.plans/` via Edit. If `.gitignore` missing, create with Write containing only `.plans/`.

   b. **Create `.plans/`**: Run `mkdir -p .plans` to ensure directory exists.

   Step idempotent - if `.plans/` already in `.gitignore` and directory exists, do nothing.

2. **Analyze prompt**: Read and understand full scope. If prompt references files or codebase, use Glob and Read for context.

3. **Identify atomic tasks**: Break prompt into smallest independently executable units. Each task must:
   - Have clear, measurable outcome
   - Be executable by single sub-agent
   - Take no more than one focused action

4. **Map dependencies**: Determine which tasks depend on others. Tasks without dependencies run parallel.

5. **Save plan as draft**: Create plan directory and files **BEFORE presenting to user**:

   a. **Create plan directory**: `.plans/<timestamp>-<slug>/` (e.g. `.plans/2025-01-15-refactor-auth/`)

   b. **Save plan index**: `.plans/<timestamp>-<slug>/plan.md` with `status: draft`:

   ```markdown
   ---
   title: <plan title>
   created: <ISO timestamp>
   status: draft
   total-tasks: <N>
   phases: <N>
   completed-tasks: 0
   failed-tasks: 0
   ---

   # <Plan Title>

   ## Phase 1: <phase description>
   **Execution**: parallel

   | Task | Title | Status |
   |------|-------|-------- |
   | [1.1](tasks/task-1.1.md) | <title> | pending |
   | [1.2](tasks/task-1.2.md) | <title>  | pending |

   ## Phase 2: <phase description>
   **Execution**: sequential (depends on Phase 1)

   | Task | Title | Status |
   |------|-------|--------|
   | [2.1](tasks/task-2.1.md) | <title> | pending |
   ```

   c. **Save each task as separate file**: `.plans/<timestamp>-<slug>/tasks/task-<phase>.<number>.md`

   Task file format:

   ```markdown
   ---
   id: "1.1"
   title: <task title>
   phase: 1
   status: pending
   agent: general-purpose | Bash
   dependencies: []
   created: <ISO timestamp>
   ---

   # Task 1.1: <title>

   ## Description
   <detailed description of what to do>

   ## Expected Outcome
   <what should be true when this task is complete>

   ## Context
   <relevant file paths, function names, or references needed>
   ```

   d. **Use `mkdir -p`** to create `tasks/` subdirectory before writing task files.

6. **Propose plan**: Present plan to user, update `plan.md` status to `reviewing`:

   ```
   ## Plan: <title>

   ### Phase 1 (parallel)
   - [ ] Task 1.1: <description>
   - [ ] Task 1.2: <description>

   ### Phase 2 (depends on Phase 1)
   - [ ] Task 2.1: <description>

   ### Phase 3 (parallel, depends on Phase 2)
   - [ ] Task 3.1: <description>
   - [ ] Task 3.2: <description>
   ```

7. **Iterate with user**: Use AskUserQuestion to ask if user wants to:
   - **Approve** plan as-is → update `status: approved`, proceed to step 8
   - **Modify** specific tasks → apply changes, **update files on disk immediately**, keep `status: reviewing`
   - **Add/remove** tasks → apply changes, **update files on disk immediately**
   - **Change** task ordering or dependencies → apply changes, **update files on disk immediately**
   - **Suspend** review (e.g. "sospendi", "ci penso", "riprendiamo dopo") → update `status: suspended`,
     inform user plan saved at `<plan-dir>/`, resumable in future session

   **CRITICAL**: At every iteration, update `plan.md` and task files on disk immediately.
   Ensures plan state always persisted and recoverable.

   Iterate until user approves or suspends.

8. **Ask to execute**: After approval, use AskUserQuestion to ask:
   - "Vuoi eseguire i task del piano adesso?"
   - Options: **Esegui ora** / **Non eseguire**

9. **If user chooses to execute**, proceed with full execution flow:

   a. **Discover task files**: Use Glob to find all task files (`<plan-dir>/tasks/task-*.md`). Read each to load metadata (id, phase, status, agent, dependencies).

   b. **Create task tracking**: Use TaskCreate for each task, with task file content as description. Set up dependencies via `addBlockedBy`.

   c. **Set plan status to `in-progress`**: Update `plan.md` frontmatter.

   d. **Execute by phase**: For each phase in order:

      1. **Identify ready tasks**: All task files for current phase with `status: pending` and all dependencies `completed`.

      2. **Launch parallel agents**: For each ready task, use Task tool:
         - `subagent_type: "Bash"` for tasks with `agent: Bash`
         - `subagent_type: "general-purpose"` for tasks with `agent: general-purpose`
         - Pass **full content of task file** as prompt
         - Append relevant context from prior task outputs if needed

      3. **Wait and collect results** from all parallel agents.

      4. **For EACH completed task** (immediately, one by one):
         - **Update task file**: change `status: pending` to `status: completed` (or `failed`), append `## Execution Result` with output and timestamp
         - **Update `plan.md`**: change task's row in phase table, update `completed-tasks`/`failed-tasks` counters in frontmatter
         - **Update tracking**: mark completed via TaskUpdate

      5. **Handle failures**: update task file and `plan.md` with failed status, ask user to retry/skip/abort.

   e. **Finalize plan**: Update `plan.md` status to `completed` (or `partial`), append `## Summary` section with totals and timestamp.

   f. **Present final report**: Show detailed summary to user:
      - Total tasks, completed, failed, skipped counts
      - For each task: title, status, brief description of what was done (from `## Execution Result` of each task file)
      - List of all files created or modified by execution

   g. **Cleanup prompt**: Use AskUserQuestion to ask:
      - "Vuoi eliminare i file di pianificazione?"
      - Options: **Elimina** (delete entire plan directory `.plans/<slug>/`) / **Mantieni** (keep for reference)

   h. **If user chooses to delete**: Remove plan directory with `rm -rf <plan-dir>`. If `.plans/` now empty, remove it too with `rmdir .plans/`.

   i. **If user chooses to keep**: Inform user files at `<plan-dir>/` for reference.

10. **If user chooses not to execute**, inform them they can run later with:
    ```
    /planning-workflow:task-exec <plan-directory-path>
    ```

### Plan Status Lifecycle

Plans follow this status lifecycle in `plan.md` frontmatter:

```
draft → reviewing → approved → executing → completed
                  ↘ suspended ↗
```

- **`draft`**: plan generated and saved to disk, not yet shown to user
- **`reviewing`**: plan presented to user, iteration in progress
- **`suspended`**: user paused review (resumable in any future session)
- **`approved`**: user confirmed plan, ready for execution
- **`executing`**: tasks being run (set via `in-progress` in frontmatter)
- **`completed`**: all tasks finished (or `partial` if some failed)

### Rules
- **Save before presenting**: always persist plan to disk BEFORE showing to user
- **Update on every change**: every modification during review must be written to disk immediately
- During planning (steps 1-7): never execute tasks, only plan
- During execution (step 9): follow same rules as `/planning-workflow:task-exec`
- Each task must specify which agent type best suited (general-purpose for code/research, Bash for commands)
- Group independent tasks into phases for parallel execution
- Be specific: vague tasks lead to poor execution
- Each task MUST be written to own file - never inline task details in plan index
- **Update `plan.md` after EVERY single task completion** - not just at end of phase
- Plan index (`plan.md`) must always reflect real-time state of execution
- When resuming suspended plan, re-read all task files to rebuild full context