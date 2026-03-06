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
