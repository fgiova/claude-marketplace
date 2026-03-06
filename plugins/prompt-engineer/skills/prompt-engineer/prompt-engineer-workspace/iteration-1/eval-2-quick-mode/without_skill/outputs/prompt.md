# Cold Outreach Email Prompt

Write a cold outreach email to a SaaS CTO to book a demo call for an API monitoring tool.

## Constraints

- **Maximum length:** 150 words
- **Tone:** Direct, peer-to-peer, conversational. Write like a technical founder talking to another technical leader — not a salesperson. No hype, no filler, no buzzwords.
- **Do NOT:** Use generic compliments ("I love what you're building"), spam patterns ("I hope this finds you well"), exclamation marks, or anything that reads like a mass template. Avoid phrases commonly flagged as AI-generated (e.g., "leverage," "game-changer," "revolutionize").

## Structure

1. **Opening (1 sentence):** Reference something specific and verifiable about their company — a recent API-related incident, a public-facing integration, a job posting mentioning API infrastructure, or a technical blog post. This must feel researched, not scraped.
2. **Problem hook (1-2 sentences):** Name a concrete pain point that CTOs at their stage encounter with API reliability or observability. Be specific enough that it resonates only with someone who has actually dealt with it.
3. **Credibility nudge (1 sentence):** Mention one concrete result — a metric, a named customer (if possible), or a specific technical differentiator. No vague claims.
4. **CTA (1 sentence):** Offer a 15-minute call with a direct calendar link. Frame it as low-commitment. Do not ask "Would you be open to..." — instead, make it easy: "Here's my calendar if it's worth a look: [link]".

## Inputs to fill before sending

- `{{company_name}}` — Prospect's company
- `{{specific_reference}}` — The researched detail about their company (API docs page, job posting, blog post, outage, etc.)
- `{{pain_point}}` — The specific API reliability/observability challenge relevant to their scale
- `{{proof_point}}` — A concrete metric or customer result (e.g., "cut P1 API incident MTTR by 60% for [customer]")
- `{{calendar_link}}` — Your scheduling link

## Success criteria

The email succeeds if the CTO either replies to continue the conversation or clicks the calendar link to book a call. Optimize for reply rate, not open rate.
