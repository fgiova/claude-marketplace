---
description: Build a structured, high-quality prompt using the 6-phase framework (Task, Context, Reference, Brief, Rules, Conversation)
allowed-tools: AskUserQuestion, Read, Write, Bash(pbcopy), Glob
---

Activate the `prompt-engineer` skill to guide the user through building a structured prompt.

Start by asking the user which mode they prefer:
- **Full mode** — All 6 phases (Task, Context Files, Reference, Brief, Rules, Conversation)
- **Quick mode** — 3 phases only (Task, Brief, Conversation)

Then proceed phase by phase, using AskUserQuestion at each step. Follow the complete workflow defined in the prompt-engineer skill.
