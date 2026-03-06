# Prompt Engineer Plugin

A structured prompt engineering plugin that guides you step-by-step through building high-quality, reusable prompts using a proven 6-phase framework.

## Why This Plugin

Most AI prompts are written as one-shot instructions — flat, unstructured, and inconsistent. This plugin applies a systematic methodology that separates the *what* (task), *who* (audience and context), *how* (reference patterns), and *why* (success criteria) into distinct phases, producing prompts that are reusable, auditable, and consistently effective.

The final prompt is always generated in **English**, regardless of the conversation language.

## The 6-Phase Framework

| Phase | Name | What Happens |
|-------|------|-------------|
| 1 | **Task** | Define what the prompt should accomplish: "I want to [TASK] so that [SUCCESS CRITERIA]." |
| 2 | **Context Files** | Gather or create files with your standards, constraints, audience, and tone rules. |
| 3 | **Reference** | Analyze an example output and reverse-engineer it into "Always/Never" rules. |
| 4 | **Brief** | Capture output type, recipient reaction, anti-patterns, and success definition. |
| 5 | **Rules** | Wire context files as guardrails — the AI must read them and flag any rule violations. |
| 6 | **Conversation** | Add collaborative refinement: the AI asks clarifying questions before executing. |

## Usage

### Slash Command

```
/prompt-engineer
```

### Auto-activation

The skill activates automatically when you mention prompt creation:
- "build a prompt for..."
- "create a prompt template for..."
- "crea un prompt per..."
- "help me design a structured prompt"
- "prompt engineering help"
- "voglio un prompt per..."

### Modes

| Mode | Phases | Best For |
|------|--------|----------|
| **Full** | All 6 phases | Complex, high-stakes prompts where quality and consistency matter |
| **Quick** | 1, 4, 6 only | Simpler prompts or when you already know exactly what you want |

## Workflow Example

```
You: "build a prompt for weekly engineering status reports"

[Phase 1] Claude asks you to define the task and success criteria
[Phase 2] Claude interviews you about standards, then creates context.md
[Phase 3] Claude asks for a reference report, reverse-engineers its patterns
[Phase 4] Claude walks you through the SUCCESS BRIEF (output type, tone, success)
[Phase 5] Claude wires the context file into the prompt as a guardrail
[Phase 6] Claude adds collaborative refinement instructions

Final prompt is shown for review → save to file or copy to clipboard (pbcopy)
```

## Output Options

After the prompt is assembled, you choose how to save it:

1. **Save to file** — writes to a `.md` file (default: `prompt.md`)
2. **Copy to clipboard** — copies directly via `pbcopy`

## Key Design Decisions

- **No role assignments** — The generated prompt never uses "act as" or "you are a". It leads with the task, not a persona.
- **Context files over inline instructions** — Standards, constraints, and audience rules live in separate files that the prompt references. This makes prompts modular and reusable.
- **Always/Never rules** — Reference analysis extracts concrete, actionable rules instead of vague "make it sound like this".
- **Collaborative refinement** — Every prompt ends with instructions for the AI to ask clarifying questions and present a plan *before* executing. This prevents misaligned first drafts.

## Installation

```bash
/plugin install prompt-engineer@fgiova-claude-marketplace
```

## Requirements

- Claude Code CLI
- macOS (for `pbcopy` clipboard support)
