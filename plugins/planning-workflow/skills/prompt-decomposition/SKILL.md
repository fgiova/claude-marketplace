---
name: prompt-decomposition
description: Best practices for decomposing complex prompts into atomic, executable tasks with dependency mapping
version: 1.0.0
---

# Prompt Decomposition

Guidelines for breaking down complex prompts into well-structured, executable task plans.

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
