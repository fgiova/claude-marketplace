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

5. **Propose the plan**: Present the plan to the user in this format:

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

6. **Ask for confirmation**: Use AskUserQuestion to ask the user if they want to:
   - Approve the plan as-is
   - Modify specific tasks
   - Add/remove tasks
   - Change task ordering or dependencies

7. **Iterate** until the user approves.

8. **Save the plan**: Once approved, create the plan directory and files:

   a. **Create the plan directory**: `.plans/<timestamp>-<slug>/` (e.g. `.plans/2025-01-15-refactor-auth/`)

   b. **Save the plan index**: `.plans/<timestamp>-<slug>/plan.md` with metadata and task references:

   ```markdown
   ---
   title: <plan title>
   created: <ISO timestamp>
   status: approved
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

9. **Ask to execute**: After saving the plan, use AskUserQuestion to ask:
   - "Vuoi eseguire i task del piano adesso?"
   - Options: **Esegui ora** / **Non eseguire**

10. **If the user chooses to execute**, proceed with the full execution flow:

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

11. **If the user chooses not to execute**, inform them they can run it later with:
    ```
    /planning-workflow:task-exec <plan-directory-path>
    ```

### Rules
- During planning (steps 1-8): never execute tasks, only plan
- During execution (step 10): follow the same rules as `/planning-workflow:task-exec`
- Each task must specify which agent type is best suited (general-purpose for code/research, Bash for commands)
- Group independent tasks into phases for parallel execution
- Be specific: vague tasks lead to poor execution
- Each task MUST be written to its own file - never inline task details in the plan index
- **Update `plan.md` after EVERY single task completion** - not just at the end of a phase
- The plan index (`plan.md`) must always reflect the real-time state of execution
