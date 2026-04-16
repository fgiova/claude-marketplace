---
description: Execute tasks from plan file using parallel sub-agents
argument-hint: "<path to plan file in .plans/>"
allowed-tools: Read(*), Write(*), Edit(*), Glob(*), Grep(*), Bash(*), AskUserQuestion(*), Task(*), TaskCreate(*), TaskUpdate(*), TaskList(*), TaskGet(*)
---

## Planning Workflow - Task Execution

Task execution orchestrator. Read approved plan, execute tasks via parallel sub-agents `@task-executor-agent`.

### Input

Plan directory path: `$ARGUMENTS`

Path to plan directory (e.g. `.plans/2025-01-15-refactor-auth/`) or slug. No path → use most recent plan dir in `.plans/`.

### Execution Process

1. **Load the plan**: Read `plan.md` from plan dir. Verify status `approved`. If not, tell user.

2. **Discover task files**: Glob task files in `tasks/` subdir (pattern: `<plan-dir>/tasks/task-*.md`). Read each to load metadata (id, phase, status, agent, dependencies).

3. **Create task tracking**: TaskCreate register each task, use task file content as description. Set dependencies via `addBlockedBy` from `dependencies` frontmatter.

4. **Set plan status to `in-progress`**: Before any task exec, update `plan.md` frontmatter: `status: approved` → `status: in-progress`.

5. **Execute by phase**: Each phase in order:

   a. **Identify ready tasks**: Find task files for current phase with status `pending` and all deps `completed`.

   b. **Launch parallel agents**: Each ready task, use Task tool to launch sub-agent:
      - `subagent_type: "Bash"` for `agent: Bash`
      - `subagent_type: "general-purpose"` for `agent: general-purpose`
      - Pass **full task file content** as prompt
      - Append context from prior task outputs if needed

   c. **Wait and collect results**: Gather outputs from parallel agents.

   d. **For EACH completed task** (immediate, one by one as results arrive):

      1. **Update the task file**:
         - `status: pending` → `status: completed` (or `status: failed`)
         - Append `## Execution Result` section with agent output + timestamp

      2. **Update `plan.md`** (plan index):
         - Phase table: task row `pending` → `completed` (or `failed`)
         - Update `completed-tasks` (or `failed-tasks`) counter in frontmatter
         - All tasks done → mark phase complete

      3. **Update tracking**: Mark task completed via TaskUpdate.

   e. **Handle failures**: Task fails:
      - Update task file `status: failed` + error details
      - Update `plan.md` with failed status (same as step d.2)
      - Check if dependent tasks can proceed
      - Report to user, ask: retry, skip, or abort

6. **Finalize the plan**: All phases done:
   - Update `plan.md` frontmatter: `status: in-progress` → `status: completed` (or `status: partial` if any failed)
   - Append `## Summary` section at bottom of `plan.md`:

   ```markdown
   ## Summary
   - **Completed at**: <ISO timestamp>
   - **Total tasks**: N
   - **Completed**: N
   - **Failed**: N
   - **Skipped**: N
   ```

7. **Final report**: Detailed summary to user:
   - Total tasks, completed, failed, skipped counts
   - Each task: title, status, brief description of work (from `## Execution Result` of each task file)
   - All files created/modified (aggregate from task results)

8. **Cleanup prompt**: After summary, AskUserQuestion:
   - "Vuoi eliminare i file di pianificazione?"
   - Options: **Elimina** (delete plan dir `.plans/<slug>/`) / **Mantieni** (keep files)

9. **If user deletes**: Remove plan dir via `rm -rf <plan-dir>`. If `.plans/` now empty, remove with `rmdir .plans/` (silent-fail if not empty, fine).

10. **If user keeps**: Tell user plan files at `<plan-dir>/` for future reference.

### Rules
- Read task details from individual task files, never from plan index
- Execute tasks within phase in parallel when possible
- **Update `plan.md` after EVERY task completion** - not just end of phase
- Never skip dependency checks
- Update each task file immediately after exec for crash recovery
- Plan index (`plan.md`) must always reflect real-time execution state
- No plan path given + multiple plans in `.plans/` → ask user which to execute
- Clear progress updates between phases