---
description: Execute tasks from a plan file using parallel sub-agents
argument-hint: "<path to plan file in .plans/>"
allowed-tools: Read(*), Write(*), Edit(*), Glob(*), Grep(*), Bash(*), AskUserQuestion(*), Task(*), TaskCreate(*), TaskUpdate(*), TaskList(*), TaskGet(*)
---

## Planning Workflow - Task Execution

You are a task execution orchestrator. Your job is to read an approved plan and execute its tasks efficiently using parallel sub-agents `@task-executor-agent`.

### Input

Plan directory path: `$ARGUMENTS`

This should be a path to a plan directory (e.g. `.plans/2025-01-15-refactor-auth/`) or just the slug. If no path is provided, look for the most recent plan directory in `.plans/`.

### Execution Process

1. **Load the plan**: Read `plan.md` from the plan directory. Verify its status is `approved`. If not, inform the user.

2. **Discover task files**: Use Glob to find all task files in the `tasks/` subdirectory of the plan (pattern: `<plan-dir>/tasks/task-*.md`). Read each task file to load its metadata (id, phase, status, agent, dependencies).

3. **Create task tracking**: Use TaskCreate to register each task, using the task file content as the description. Set up dependencies using `addBlockedBy` based on each task's `dependencies` frontmatter field.

4. **Set plan status to `in-progress`**: Before executing any task, update `plan.md` frontmatter: change `status: approved` to `status: in-progress`.

5. **Execute by phase**: For each phase in order:

   a. **Identify ready tasks**: Find all task files for the current phase whose status is `pending` and whose dependencies are all `completed`.

   b. **Launch parallel agents**: For each ready task, use the Task tool to launch a sub-agent:
      - Use `subagent_type: "Bash"` for tasks with `agent: Bash`
      - Use `subagent_type: "general-purpose"` for tasks with `agent: general-purpose`
      - Pass the **full content of the task file** as the prompt
      - Append relevant context from prior task outputs if needed

   c. **Wait and collect results**: Gather outputs from all parallel agents.

   d. **For EACH completed task** (immediately, one by one as results come in):

      1. **Update the task file**:
         - Change `status: pending` to `status: completed` (or `status: failed`)
         - Append an `## Execution Result` section with the agent's output and a timestamp

      2. **Update `plan.md`** (the plan index):
         - In the phase table, change the task's row status from `pending` to `completed` (or `failed`)
         - Update `completed-tasks` (or `failed-tasks`) counter in the frontmatter
         - If all tasks in a phase are done, mark the phase as complete

      3. **Update tracking**: Mark the task as completed via TaskUpdate.

   e. **Handle failures**: If a task fails:
      - Update the task file with `status: failed` and the error details
      - Update `plan.md` with the failed status (same as step d.2)
      - Check if dependent tasks can still proceed
      - Report to the user and ask whether to retry, skip, or abort

6. **Finalize the plan**: When all phases are complete:
   - Update `plan.md` frontmatter: change `status: in-progress` to `status: completed` (or `status: partial` if some tasks failed)
   - Append a `## Summary` section at the bottom of `plan.md`:

   ```markdown
   ## Summary
   - **Completed at**: <ISO timestamp>
   - **Total tasks**: N
   - **Completed**: N
   - **Failed**: N
   - **Skipped**: N
   ```

7. **Final report**: Present a detailed summary to the user, including:
   - Total tasks, completed, failed, skipped counts
   - For each task: title, status, and a brief description of what was done (extracted from the `## Execution Result` of each task file)
   - List of all files created or modified by the execution (aggregate from all task results)

8. **Cleanup prompt**: After presenting the summary, use AskUserQuestion to ask:
   - "Vuoi eliminare i file di pianificazione?"
   - Options: **Elimina** (delete the entire plan directory `.plans/<slug>/`) / **Mantieni** (keep the files for reference)

9. **If the user chooses to delete**: Remove the entire plan directory using `rm -rf <plan-dir>`. If the `.plans/` directory is now empty, remove it too with `rmdir .plans/` (will fail silently if not empty, which is fine).

10. **If the user chooses to keep**: Inform the user that the plan files are available at `<plan-dir>/` for future reference.

### Rules
- Always read task details from individual task files, never from the plan index
- Always execute tasks within a phase in parallel when possible
- **Update `plan.md` after EVERY single task completion** - not just at the end of a phase
- Never skip dependency checks
- Update each task file immediately after execution for crash recovery
- The plan index (`plan.md`) must always reflect the real-time state of the execution
- If no plan path is given and multiple plans exist in `.plans/`, ask the user which one to execute
- Provide clear progress updates between phases
