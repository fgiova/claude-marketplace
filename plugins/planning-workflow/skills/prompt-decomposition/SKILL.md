---
name: prompt-decomposition
description: |
  ALWAYS consult this skill when the user asks to plan, organize, decompose, break down, or
  structure a complex task — or when the user provides a large, multi-step prompt that clearly
  needs decomposition before execution. Also activate when the user wants to resume, continue,
  or review an existing plan from a previous session. This skill contains the exact workflow
  for creating structured execution plans with atomic tasks, dependency mapping, and parallel
  phases, with full persistence and cross-session resume support.
  Without this skill, Claude will attempt to execute complex tasks monolithically instead of
  decomposing them into manageable, parallelizable sub-tasks.
  Covers: task decomposition principles (atomicity, independence, clarity, completeness),
  dependency mapping (data, order, resource dependencies), phase organization, conflict
  avoidance, plan file format, execution via sub-agents, plan persistence and resume.
  Trigger on ANY mention of: pianifica, pianificare, piano, plan, planning, make a plan,
  crea un piano, scomponi, break down, decompose, organize tasks, step by step, fasi, phases,
  troppo complesso, complex task, come organizzo, approccio strutturato, implementation plan,
  migration plan, refactoring plan, task decomposition, parallel tasks, divide in task,
  riprendi piano, resume plan, continua piano, riprendi pianificazione, continue planning,
  sospendi piano, suspend plan, riprendi, resume.
version: 1.1.0
---

# Prompt Decomposition

**IMPORTANT**: When this skill activates because the user is asking to plan or decompose a task,
you MUST follow the full planning workflow procedure described below. Do NOT just give advice —
actually execute the workflow.

## Activation Behavior

### Resume Check (ALWAYS do this first)

When this skill activates, **before doing anything else**, check if there are existing plans
that can be resumed:

1. Use Glob to check for `.plans/*/plan.md` files
2. Read the frontmatter of each `plan.md` found
3. If any plan has `status: draft`, `status: reviewing`, or `status: suspended`:
   - Present the list of resumable plans to the user with their title, status, and creation date
   - Ask: "Vuoi riprendere uno di questi piani o crearne uno nuovo?"
   - If the user chooses to resume, load the plan and jump to **step 6** (review iteration)
   - If the user chooses to create a new plan, proceed with step 1 below

### New Plan Creation

When the user asks to plan something (e.g. "pianifica questo", "make a plan for...", "break this down into tasks"),
follow the **exact same procedure** as the `/planning-workflow:plan` command:

1. **Bootstrap `.plans/`**: check `.gitignore` for `.plans/`, add if missing, create directory
2. **Analyze the prompt**: understand full scope, read referenced files if any
3. **Identify atomic tasks**: break into smallest independently executable units
4. **Map dependencies**: determine task ordering and parallel groups
5. **Save the plan as draft**: write `plan.md` (with `status: draft`) and individual task files
   in `.plans/<timestamp>-<slug>/tasks/` **BEFORE presenting it to the user**.
   This ensures the plan is persisted even if the session is interrupted.
6. **Propose the plan**: present the structured plan with phases and tasks to the user.
   Update `plan.md` status to `reviewing`.
7. **Iterate with the user**: the user can:
   - **Approve** the plan → update `status: approved`, proceed to step 8
   - **Request modifications** → apply changes, update files on disk, keep `status: reviewing`
   - **Suspend** the discussion (e.g. "sospendi", "ci penso", "riprendiamo dopo") →
     update `status: suspended`, inform the user the plan is saved and can be resumed
     in a future session by asking to "riprendi il piano" or "resume plan"
   - At **every iteration**, update `plan.md` and task files on disk immediately
8. **Ask to execute**: offer immediate execution or defer to `/planning-workflow:task-exec`
9. **If executing**: run tasks in parallel phases via Task tool, update plan.md after every task
10. **Final summary**: present results, ask whether to delete or keep planning files

Refer to the `/planning-workflow:plan` command for the full specification of each step,
including file formats, frontmatter schemas, and execution rules.

### Plan Status Lifecycle

Plans follow this status lifecycle in the `plan.md` frontmatter:

```
draft → reviewing → approved → executing → completed
                  ↘ suspended ↗
```

- **`draft`**: plan just generated and saved, not yet shown to user
- **`reviewing`**: plan presented to user, iteration in progress
- **`suspended`**: user explicitly paused the review (resumable cross-session)
- **`approved`**: user confirmed the plan, ready for execution
- **`executing`**: tasks are being run
- **`completed`**: all tasks finished (or `partial` if some failed)

---

## Guidelines

Below are the best practices applied during task decomposition.

## Decomposition Principles

### Atomicity
- Each task should do exactly one thing
- A task is atomic when it cannot be split further without losing meaning
- If a task description contains "and", it likely needs splitting
- Good: "Create the User model in src/models/user.ts"
- Bad: "Create the User model and add validation and write tests"

### Independence
- Maximize the number of tasks that can run in parallel
- A task is independent when it requires no output from another task in the same phase
- Extract shared dependencies into earlier phases

### Clarity
- Task descriptions must be unambiguous
- Include specific file paths, function names, and expected behavior
- A different developer (or agent) should be able to execute the task without asking questions

### Completeness
- The full set of tasks must cover the entire original prompt
- After executing all tasks, the original request should be fully satisfied
- Include verification tasks to confirm correctness

## Dependency Mapping

### Identifying Dependencies
- **Data dependency**: Task B needs output from Task A (e.g., B reads a file A creates)
- **Order dependency**: Task B must run after Task A (e.g., tests after implementation)
- **Resource dependency**: Tasks A and B modify the same file (serialize to avoid conflicts)

### Phase Organization
- **Phase 1**: Research and context gathering (read existing code, understand requirements)
- **Phase 2**: Core implementation (create/modify files, independent tasks in parallel)
- **Phase 3**: Integration (connect components, resolve cross-cutting concerns)
- **Phase 4**: Verification (run tests, validate output, review)

### Conflict Avoidance
- Never put two tasks that edit the same file in the same parallel phase
- If two tasks create interdependent modules, serialize them
- Shared configuration changes should be in their own task

## Task Specification Format

Each task should specify:
- **Title**: Short, action-oriented (imperative verb + object)
- **Description**: What to do, where, and expected outcome
- **Agent type**: `general-purpose` for code/research, `Bash` for shell commands
- **Input**: What context or files the task needs
- **Output**: What the task produces (files, information, side effects)
- **Dependencies**: Which tasks must complete first

## Common Patterns

### Feature Implementation
1. Analyze existing code structure (parallel research tasks)
2. Create data models / types (may be parallel if independent)
3. Implement core logic (serialize if touching same modules)
4. Add integration points (depends on core logic)
5. Write tests (depends on implementation)

### Refactoring
1. Identify all usages of target code (research)
2. Create new abstraction (implementation)
3. Migrate each usage (parallel if independent files)
4. Remove old code (depends on all migrations)
5. Verify no regressions (depends on cleanup)

### Bug Fix
1. Reproduce and understand the bug (research)
2. Identify root cause (depends on reproduction)
3. Implement fix (depends on root cause)
4. Add regression test (parallel with fix or after)
5. Verify fix resolves the issue (depends on both)

## Anti-Patterns

- **God task**: One task that does everything - always decompose further
- **Phantom dependency**: Marking tasks as dependent when they're actually independent
- **Missing verification**: No task to confirm the work is correct
- **Vague scope**: "Improve the code" instead of "Extract validation logic from UserController into UserValidator class"
- **Over-decomposition**: Splitting trivially simple work into many tiny tasks adds overhead without benefit
