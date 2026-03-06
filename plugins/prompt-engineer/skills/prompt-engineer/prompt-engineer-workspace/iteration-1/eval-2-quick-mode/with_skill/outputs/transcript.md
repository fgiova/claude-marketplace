# Prompt Engineer - Conversation Transcript
## Eval 2: Quick Mode

---

### Step 0: Choose Mode

**Assistant:** Welcome! I'm here to help you build a structured, high-quality prompt. Before we start, which mode would you prefer?

- **Full mode** -- All 6 phases (Task, Context Files, Reference, Brief, Rules, Conversation). Best for complex, high-stakes prompts.
- **Quick mode** -- Phases 1, 4, and 6 only (Task, Brief, Conversation). Skips Context Files, Reference, and Rules. Good for simpler prompts or when you already know exactly what you want.

**User:** I want to quickly create a prompt for writing cold outreach emails to potential clients. Quick mode please.

**Assistant:** Quick mode it is. We'll go through three phases: Task, Brief, and Conversation. Let's start.

---

### Phase 1: Task

**Assistant:** Define your task using this format:

> "I want to [TASK] so that [SUCCESS CRITERIA]."

Be specific about what the prompt should accomplish and what success looks like. No role assignments -- just the task and the outcome.

**Example:**
> "I want to generate a weekly project status report so that stakeholders can quickly understand progress, blockers, and next steps without attending a meeting."

What's your task?

**User:** I want to write cold outreach emails to SaaS CTOs so that they book a 15-minute demo call for our API monitoring tool.

**Assistant:** That's a strong task statement -- specific audience (SaaS CTOs), clear action (write cold outreach emails), concrete success criteria (book a 15-minute demo call), and a defined product (API monitoring tool). No refinement needed. Let's move to the Brief.

---

### Phase 4: Brief

**Assistant:** Now let's fill out the SUCCESS BRIEF. I'll ask each question one at a time.

**Question 1 -- Type of output + length:** What type of output should the prompt produce, and roughly how long?

**User:** Cold email, 150 words max.

**Assistant:** Got it -- cold email, capped at 150 words. Tight and punchy.

**Question 2 -- Recipient's reaction:** After reading the output, what should the recipient (the CTO) think, feel, or do?

**User:** The CTO thinks "this person understands my pain, let me hear more."

**Assistant:** Perfect -- empathy-driven, curiosity-generating. Not "buy now" but "tell me more."

**Question 3 -- Does NOT sound like:** What should the output avoid sounding like?

**User:** Spam, generic templates, pushy salesperson, AI-generated.

**Assistant:** Clear anti-patterns. The email should feel human, specific, and conversational.

**Question 4 -- Success means:** What concrete outcome defines success?

**User:** They reply or click the calendar link.

**Assistant:** Great. The Brief is complete:

- **Type of output + length:** Cold email, 150 words max.
- **Recipient's reaction:** CTO thinks "this person understands my pain, let me hear more."
- **Does NOT sound like:** Spam, generic templates, pushy salesperson, AI-generated.
- **Success means:** They reply or click the calendar link.

Moving to the final phase.

---

### Phase 6: Conversation

**Assistant:** This phase adds collaborative refinement instructions to the prompt. No input needed from you -- I'll wire in the closing section that tells the AI to ask clarifying questions before executing, present an execution plan, and only begin once alignment is confirmed.

Since we're in Quick mode, the Conversation section omits context file references and rules listing. It simply instructs the AI to:

1. NOT start executing yet
2. Ask clarifying questions to refine the approach step by step
3. Present an execution plan (5 steps maximum)
4. Only begin work once alignment is confirmed

---

### Final Assembly

**Assistant:** Here is the assembled prompt:

---

> I want to write cold outreach emails to SaaS CTOs so that they book a 15-minute demo call for our API monitoring tool.
>
> Here's what I need for my version:
>
> SUCCESS BRIEF
> Type of output + length: Cold email, 150 words max.
> Recipient's reaction: The CTO thinks "this person understands my pain, let me hear more."
> Does NOT sound like: Spam, generic templates, pushy salesperson, AI-generated.
> Success means: They reply or click the calendar link.
>
> DO NOT start executing yet. Instead, ask me clarifying questions so we can refine the approach together step by step.
>
> Then give me your execution plan (5 steps maximum).
> Only begin work once we've aligned.

---

The prompt has been saved to `prompt.md`.
