# Prompt Engineer Session Transcript

## Full Mode - Weekly Engineering Status Report Prompt

---

## Step 0: Choose Mode

**Prompt Engineer:** Welcome! I'll help you build a structured prompt using a 6-phase framework. Which mode would you prefer?

- **Full mode** -- All 6 phases. Best for complex, high-stakes prompts where quality matters.
- **Quick mode** -- Phases 1, 4, and 6 only (Task, Brief, Conversation). Faster, for simpler prompts.

**User:** I want the full mode.

**Prompt Engineer:** Full mode it is. We'll go through all 6 phases: Task, Context Files, Reference, Brief, Rules, and Conversation. Let's start.

---

## Phase 1: Task

**Prompt Engineer:** Define your task using this format:

> "I want to [TASK] so that [SUCCESS CRITERIA]."

What should this prompt accomplish, and what does success look like?

**User:** I want to generate weekly engineering status reports so that the VP of Engineering can quickly assess project health, blockers, and resource needs without scheduling a sync meeting.

**Prompt Engineer:** That's a strong task statement. It's specific (weekly engineering status reports), has a clear audience (VP of Engineering), and measurable success criteria (the VP can assess project health, blockers, and resource needs without a meeting). No refinement needed. Moving to Phase 2.

---

## Phase 2: Context Files

**Prompt Engineer:** Do you have existing context files (standards, guidelines, tone rules, audience profiles) that should inform this prompt?

**User:** No existing context files.

**Prompt Engineer:** No problem. I'll interview you to build one. Let me ask about your standards, constraints, audience, and tone.

**Prompt Engineer:** What are your quality standards -- what does a "good" report look like to you?

**User:** Data-driven, no adjectives without metrics.

**Prompt Engineer:** What constraints or things to avoid?

**User:** Max 1 page, no marketing speak.

**Prompt Engineer:** Who is the audience? What do they care about?

**User:** VP Engineering, technical but time-constrained.

**Prompt Engineer:** What tone and voice should the report use?

**User:** Professional, direct, concise.

**Prompt Engineer:** Based on your answers, I've generated the following context file:

```markdown
# Context

## Standards
- Data-driven: every claim must be backed by a metric or measurable fact
- No adjectives without accompanying metrics (e.g., "good velocity" is not allowed; "42pts vs 40pt target" is)
- Status indicators must be categorical and unambiguous (On Track, At Risk, Off Track)

## Constraints
- Maximum 1 page in length
- No marketing speak, no filler, no corporate buzzwords
- No subjective assessments without supporting data
- No "everything is great" summaries -- surface problems first

## Audience
- VP of Engineering
- Technical background, understands engineering terminology
- Extremely time-constrained -- needs to absorb the report in under 2 minutes
- Wants to know: which projects need attention, what blockers exist, what resources are needed
- Hates fluff -- values signal over noise

## Tone & Voice
- Professional, direct, concise
- Neutral and factual -- let the data speak
- No hedging language ("might", "possibly", "hopefully")
- Assertive on blockers and escalations

## Domain Terms
- Sprint velocity (measured in story points)
- Blockers (issues preventing progress)
- Escalation (raising an issue to higher authority for resolution)
- On Track / At Risk / Off Track (project health indicators)
```

**User:** Looks good. Let's continue.

**Prompt Engineer:** Context file saved. Moving to Phase 3.

---

## Phase 3: Reference

**Prompt Engineer:** Do you have a reference example -- something that looks like what you want the prompt to produce?

**User:** Yes. Here's a sample report from a colleague that I really like:

```
## Week 47 Status
### Project Alpha (On Track)
- Sprint velocity: 42pts (target: 40)
- Blockers: None
- Next: API integration milestone by Dec 15
### Project Beta (At Risk)
- Sprint velocity: 18pts (target: 35)
- Blockers: Waiting on security review (5 days overdue)
- Next: Escalation to CISO if no response by Wed
```

**Prompt Engineer:** Great reference. Would you like me to help reverse-engineer this? I'll extract the patterns, tone, and structure as a set of rules.

**User:** Yes, please reverse-engineer it.

**Prompt Engineer:** Here are the rules I extracted from your reference:

1. **Always** lead with the week number in the top-level heading for easy chronological scanning.
2. **Always** list each project as its own subsection with the status indicator in parentheses right in the heading (e.g., "Project Alpha (On Track)").
3. **Always** include exactly three line items per project: Sprint velocity (actual vs target), Blockers, and Next action.
4. **Always** quantify velocity with actual points and target points side by side.
5. **Always** state blockers concretely with duration or overdue time when applicable (e.g., "5 days overdue").
6. **Always** include a specific next action with a date or deadline.
7. **Never** use filler phrases or subjective qualifiers -- every word must carry information.
8. **Never** bury the status indicator in the body text -- it belongs in the heading for instant scanning.
9. **Never** omit the blocker line even if there are none -- explicitly state "None" so the reader knows it was considered.
10. **Always** sort projects so that "At Risk" and "Off Track" items appear prominently (consider listing them first or using the heading status to draw attention).

**User:** Those rules are spot on. Let's keep going.

**Prompt Engineer:** Moving to Phase 4.

---

## Phase 4: Brief

**Prompt Engineer:** Now let's build your SUCCESS BRIEF. I'll ask four questions, one at a time.

**Prompt Engineer:** (1/4) What type of output should the prompt produce, and roughly how long?

**User:** Weekly status report, 1 page max.

**Prompt Engineer:** (2/4) After reading the output, what should the recipient think, feel, or do?

**User:** The VP should immediately know which projects need attention.

**Prompt Engineer:** (3/4) What should the output avoid sounding like?

**User:** Marketing copy, AI-generated fluff, verbose.

**Prompt Engineer:** (4/4) What concrete outcome defines success?

**User:** VP reads it in under 2 minutes and can make decisions.

**Prompt Engineer:** Brief captured. Moving to Phase 5.

---

## Phase 5: Rules

**Prompt Engineer:** This phase wires the context file into the prompt as a guardrail. No input needed from you -- I'll assemble the rules section that instructs the AI to:

- Read the context file completely before starting
- If about to break any rule from the context file, stop and flag it
- Treat the context file as the source of truth for standards, constraints, and audience

Rules section assembled. Moving to Phase 6.

---

## Phase 6: Conversation

**Prompt Engineer:** This final phase adds collaborative refinement instructions. No input needed -- I'll add the closing section that tells the AI to:

- NOT start executing yet
- Ask clarifying questions to refine the approach step by step
- List the 3 most relevant rules from the context file before writing
- Present an execution plan (5 steps maximum)
- Only begin work once alignment is confirmed

Conversation section assembled.

---

## Final Assembly

**Prompt Engineer:** All 6 phases are complete. Here is the assembled prompt:

---

I want to generate weekly engineering status reports so that the VP of Engineering can quickly assess project health, blockers, and resource needs without scheduling a sync meeting.

First, read these files completely before responding:
context.md - Standards, constraints, audience profile, tone rules, and domain terminology for engineering status reports

Here is a reference to what I want to achieve:

```
## Week 47 Status
### Project Alpha (On Track)
- Sprint velocity: 42pts (target: 40)
- Blockers: None
- Next: API integration milestone by Dec 15
### Project Beta (At Risk)
- Sprint velocity: 18pts (target: 35)
- Blockers: Waiting on security review (5 days overdue)
- Next: Escalation to CISO if no response by Wed
```

Here's what makes this reference work:
- Always lead with the week number in the top-level heading for chronological scanning.
- Always list each project as its own subsection with the status indicator in parentheses in the heading.
- Always include exactly three line items per project: Sprint velocity (actual vs target), Blockers, and Next action.
- Always quantify velocity with actual points and target points side by side.
- Always state blockers concretely with duration or overdue time when applicable.
- Always include a specific next action with a date or deadline.
- Never use filler phrases or subjective qualifiers -- every word must carry information.
- Never bury the status indicator in the body text -- it belongs in the heading.
- Never omit the blocker line even if there are none -- explicitly state "None."
- Always surface "At Risk" and "Off Track" projects prominently.

Here's what I need for my version:

SUCCESS BRIEF
Type of output + length: Weekly engineering status report, 1 page maximum.
Recipient's reaction: The VP of Engineering immediately knows which projects need attention, what blockers exist, and what decisions are required.
Does NOT sound like: Marketing copy, AI-generated fluff, verbose prose.
Success means: The VP reads the report in under 2 minutes and has enough information to make decisions without a follow-up meeting.

My context file contains my standards, constraints, landmines, and audience. Read it fully before starting. If you're about to break one of my rules, stop and tell me.

DO NOT start executing yet. Instead, ask me clarifying questions so we can refine the approach together step by step.

Before you write anything, list the 3 rules from my context file that matter most for this task.

Then give me your execution plan (5 steps maximum). Only begin work once we've aligned.

---

**Prompt Engineer:** How does this look? Would you like any changes before saving?

**User:** Looks great. Save it to file.

**Prompt Engineer:** Prompt saved to `prompt.md`.

---

## Session Summary

- **Mode:** Full (all 6 phases)
- **Task:** Generate weekly engineering status reports for VP of Engineering
- **Context file created:** context.md (standards, constraints, audience, tone, domain terms)
- **Reference:** Colleague's Week 47 status report -- reverse-engineered into 10 rules
- **Brief:** 1-page weekly report; VP reads in <2 min; no fluff; decision-ready
- **Output:** Final assembled prompt saved to prompt.md
