---
name: prompt-engineer
description: |
  Structured prompt engineering workshop. Guides the user through a 6-phase interactive process
  to build professional-grade prompts: (1) Task definition with success criteria, (2) Context file
  creation with standards/constraints/audience, (3) Reference analysis and reverse-engineering into
  Always/Never rules, (4) Success brief with output specs, (5) Guardrail wiring, (6) Collaborative
  refinement instructions. Produces a complete, copy-ready prompt in English with optional clipboard
  export via pbcopy. Without this skill, prompt creation attempts will skip critical phases like
  context file generation, reference pattern extraction, and structured success briefs — producing
  one-shot prompts instead of the proven 6-phase methodology.
  MUST be consulted for: building prompts, creating prompt templates, prompt engineering, designing
  AI prompts, crafting reusable prompts, improving existing prompts, reverse-engineering reference
  documents into prompts. In Italian: crea un prompt, scrivi un prompt, prompt strutturato, voglio
  un prompt, aiutami con un prompt, migliora questo prompt.
version: 0.2.0
agent: prompter-agent
---

# Prompt Engineer

This skill orchestrates structured prompt creation by delegating the interactive workshop to the `@prompter-agent`.

## When This Skill Activates

This skill activates when the user wants to:
- Build a new prompt from scratch
- Improve or restructure an existing prompt
- Create a reusable prompt template
- Reverse-engineer a reference document into a prompt

## Execution

When activated, **immediately delegate to the `@prompter-agent`** using the Agent tool. The agent handles the full 6-phase interactive workshop autonomously:

1. **Task** — Define what the prompt should accomplish
2. **Context Files** — Gather standards, constraints, audience (Full mode)
3. **Reference** — Analyze examples and extract Always/Never rules (Full mode)
4. **Brief** — Capture output specs and success criteria
5. **Rules** — Wire context into the prompt as guardrails (Full mode)
6. **Conversation** — Add collaborative refinement instructions

### How to Delegate

Use the Agent tool with `@prompter-agent` and pass the user's request as the prompt. Include any relevant context the user has already provided:

- If the user specified a topic or goal, include it
- If the user referenced files or examples, mention them
- If the user indicated a preference for quick/full mode, pass that along

**Example delegation prompt:**
> "The user wants to create a prompt for [topic]. They mentioned [any context]. Guide them through the 6-phase framework."

### What NOT to Do

- Do NOT execute the 6-phase workflow yourself — the agent handles it
- Do NOT ask preliminary questions before delegating — the agent will ask what it needs
- Do NOT post-process the agent's output — it delivers the final prompt directly to the user
