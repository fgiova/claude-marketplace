---
name: prompt-engineer
description: |
  Structured prompt engineering workshop. Guide user through 6-phase interactive process
  to build pro-grade prompts: (1) Task definition with success criteria, (2) Context file
  creation with standards/constraints/audience, (3) Reference analysis + reverse-engineer into
  Always/Never rules, (4) Success brief with output specs, (5) Guardrail wiring, (6) Collaborative
  refinement instructions. Produce complete, copy-ready prompt in English with optional clipboard
  export via pbcopy. Without skill, prompt creation skip critical phases like context file gen,
  reference pattern extraction, structured success briefs — produce
  one-shot prompts instead of proven 6-phase methodology.
  MUST consult for: build prompts, create prompt templates, prompt engineering, design
  AI prompts, craft reusable prompts, improve existing prompts, reverse-engineer reference
  docs into prompts. Italian: crea un prompt, scrivi un prompt, prompt strutturato, voglio
  un prompt, aiutami con un prompt, migliora questo prompt.
version: 0.2.0
agent: prompter-agent
---

# Prompt Engineer

Skill orchestrate structured prompt creation. Delegate interactive workshop to `@prompter-agent`.

## When This Skill Activates

Activate when user want:
- Build new prompt from scratch
- Improve or restructure existing prompt
- Create reusable prompt template
- Reverse-engineer reference doc into prompt

## Execution

On activate, **immediately delegate to `@prompter-agent`** via Agent tool. Agent handle full 6-phase interactive workshop autonomously:

1. **Task** — Define what prompt accomplish
2. **Context Files** — Gather standards, constraints, audience (Full mode)
3. **Reference** — Analyze examples, extract Always/Never rules (Full mode)
4. **Brief** — Capture output specs + success criteria
5. **Rules** — Wire context into prompt as guardrails (Full mode)
6. **Conversation** — Add collaborative refinement instructions

### How to Delegate

Use Agent tool with `@prompter-agent`. Pass user request as prompt. Include any context user already gave:

- User specified topic/goal → include it
- User referenced files/examples → mention them
- User indicated quick/full mode preference → pass along

**Example delegation prompt:**
> "The user wants to create a prompt for [topic]. They mentioned [any context]. Guide them through the 6-phase framework."

### What NOT to Do

- Do NOT execute 6-phase workflow yourself — agent handle it
- Do NOT ask preliminary questions before delegating — agent ask what need
- Do NOT post-process agent output — agent deliver final prompt to user direct