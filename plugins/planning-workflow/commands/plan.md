---
description: Analyze a complex prompt and create a structured execution plan interactively
argument-hint: "<complex prompt or task description>"
allowed-tools: Read(*), Write(*), Edit(*), Glob(*), Grep(*), Bash(*), AskUserQuestion(*), Task(*), TaskCreate(*), TaskUpdate(*), TaskList(*), TaskGet(*)
---

## Planning Workflow - Interactive Plan Creation

You are a planning assistant. Your job is to decompose a complex prompt into a structured, executable plan.

### Input

The user's complex prompt/task: `$ARGUMENTS`

### Process

Follow these steps precisely:

#### Resume Check (ALWAYS do this first)

Before creating a new plan, check for existing resumable plans:

1. Use Glob to check for `.plans/*/plan.md` files
2. Read the frontmatter of each `plan.md` found
3. If any plan has `status: draft`, `status: reviewing`, or `status: suspended`:
   - Present the list of resumable plans to the user with their title, status, and creation date
   - Ask: "Vuoi riprendere uno di questi piani o crearne uno nuovo?"
   - If the user chooses to resume, load the plan and jump to **step 6** (plan review iteration)
   - If the user chooses to create a new plan, proceed with step 1 below

#### New Plan Creation

1. **Bootstrap `.plans/` directory**:

   a. **Check `.gitignore`**: Use Grep to check if a `.gitignore` file exists in the project root and whether it already contains `.plans` or `.plans/`. If `.gitignore` exists but `.plans/` is NOT listed, append `.plans/` to it using Edit. If `.gitignore` does not exist, create it with Write containing only `.plans/`.

   b. **Create `.plans/`**: Run `mkdir -p .plans` to ensure the directory exists.

   This step is idempotent - if `.plans/` is already in `.gitignore` and the directory exists, do nothing.

2. **Analyze the prompt**: Read and understand the full scope of what's being asked. If the prompt references files or a codebase, use Glob and Read to understand the context.

3. **Identify atomic tasks**: Break the prompt into the smallest independently executable units. Each task should:
   - Have a clear, measurable outcome
   - Be executable by a single sub-agent
   - Take no more than one focused action

4. **Map dependencies**: Determine which tasks depend on others. Tasks without dependencies can run in parallel.

5. **Save the plan as draft**: Create the plan directory and files **BEFORE presenting to the user**:

   a. **Create the plan directory**: `.plans/<timestamp>-<slug>/` (e.g. `.plans/2025-01-15-refactor-auth/`)

   b. **Save the plan index**: `.plans/<timestamp>-<slug>/plan.md` with `status: draft`:

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

   c. **Save each task as a separate file**: `.plans/<timestamp>-<slug>/tasks/task-<phase>.<number>.md`

   Each task file has this format:

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

   d. **Use `mkdir -p`** to create the `tasks/` subdirectory before writing task files.

6. **Propose the plan**: Present the plan to the user and update `plan.md` status to `reviewing`:

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

7. **Iterate with the user**: Use AskUserQuestion to ask the user if they want to:
   - **Approve** the plan as-is → update `status: approved`, proceed to step 8
   - **Modify** specific tasks → apply changes, **update files on disk immediately**, keep `status: reviewing`
   - **Add/remove** tasks → apply changes, **update files on disk immediately**
   - **Change** task ordering or dependencies → apply changes, **update files on disk immediately**
   - **Suspend** the review (e.g. "sospendi", "ci penso", "riprendiamo dopo") → update `status: suspended`,
     inform the user the plan is saved at `<plan-dir>/` and can be resumed in a future session

   **CRITICAL**: At every iteration, update `plan.md` and task files on disk immediately.
   This ensures the plan state is always persisted and recoverable.

   Iterate until the user approves or suspends.

8. **Ask to execute**: After approval, use AskUserQuestion to ask:
   - "Vuoi eseguire i task del piano adesso?"
   - Options: **Esegui ora** / **Non eseguire**

9. **If the user chooses to execute**, proceed with the full execution flow:

   a. **Discover task files**: Use Glob to find all task files (`<plan-dir>/tasks/task-*.md`). Read each to load metadata (id, phase, status, agent, dependencies).

   b. **Create task tracking**: Use TaskCreate for each task, with the task file content as description. Set up dependencies via `addBlockedBy`.

   c. **Set plan status to `in-progress`**: Update `plan.md` frontmatter.

   d. **Execute by phase**: For each phase in order:

      1. **Identify ready tasks**: All task files for the current phase with `status: pending` and all dependencies `completed`.

      2. **Launch parallel agents**: For each ready task, use the Task tool:
         - `subagent_type: "Bash"` for tasks with `agent: Bash`
         - `subagent_type: "general-purpose"` for tasks with `agent: general-purpose`
         - Pass the **full content of the task file** as the prompt
         - Append relevant context from prior task outputs if needed

      3. **Wait and collect results** from all parallel agents.

      4. **For EACH completed task** (immediately, one by one):
         - **Update the task file**: change `status: pending` to `status: completed` (or `failed`), append `## Execution Result` with output and timestamp
         - **Update `plan.md`**: change the task's row in the phase table, update `completed-tasks`/`failed-tasks` counters in frontmatter
         - **Update tracking**: mark completed via TaskUpdate

      5. **Handle failures**: update task file and `plan.md` with failed status, ask user to retry/skip/abort.

   e. **Finalize the plan**: Update `plan.md` status to `completed` (or `partial`), append `## Summary` section with totals and timestamp.

   f. **Present final report**: Show a detailed summary to the user, including:
      - Total tasks, completed, failed, skipped counts
      - For each task: title, status, and a brief description of what was done (from the `## Execution Result` of each task file)
      - List of all files created or modified by the execution

   g. **Cleanup prompt**: Use AskUserQuestion to ask:
      - "Vuoi eliminare i file di pianificazione?"
      - Options: **Elimina** (delete the entire plan directory `.plans/<slug>/`) / **Mantieni** (keep for reference)

   h. **If the user chooses to delete**: Remove the plan directory with `rm -rf <plan-dir>`. If `.plans/` is now empty, remove it too with `rmdir .plans/`.

   i. **If the user chooses to keep**: Inform the user the files are at `<plan-dir>/` for reference.

10. **If the user chooses not to execute**, inform them they can run it later with:
    ```
    /planning-workflow:task-exec <plan-directory-path>
    ```

### Plan Status Lifecycle

Plans follow this status lifecycle in the `plan.md` frontmatter:

```
draft → reviewing → approved → executing → completed
                  ↘ suspended ↗
```

- **`draft`**: plan generated and saved to disk, not yet shown to user
- **`reviewing`**: plan presented to user, iteration in progress
- **`suspended`**: user paused the review (resumable in any future session)
- **`approved`**: user confirmed the plan, ready for execution
- **`executing`**: tasks are being run (set via `in-progress` in frontmatter)
- **`completed`**: all tasks finished (or `partial` if some failed)

### Rules
- **Save before presenting**: always persist the plan to disk BEFORE showing it to the user
- **Update on every change**: every modification during review must be written to disk immediately
- During planning (steps 1-7): never execute tasks, only plan
- During execution (step 9): follow the same rules as `/planning-workflow:task-exec`
- Each task must specify which agent type is best suited (general-purpose for code/research, Bash for commands)
- Group independent tasks into phases for parallel execution
- Be specific: vague tasks lead to poor execution
- Each task MUST be written to its own file - never inline task details in the plan index
- **Update `plan.md` after EVERY single task completion** - not just at the end of a phase
- The plan index (`plan.md`) must always reflect the real-time state of execution
- When resuming a suspended plan, re-read all task files to rebuild the full context
