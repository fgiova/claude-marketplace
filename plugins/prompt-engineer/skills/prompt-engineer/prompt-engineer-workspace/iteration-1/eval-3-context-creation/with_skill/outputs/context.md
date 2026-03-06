# Context

## Standards
- Every endpoint must include a working curl example that developers can copy-paste and run immediately
- All error codes must be documented with their meaning, likely cause, and suggested resolution
- Use plain English throughout; avoid jargon, acronyms without expansion, or overly technical language
- Each endpoint description must be self-contained: a developer should not need to read other sections to understand it

## Constraints
- Never expose internal implementation details (database schemas, internal service names, infrastructure specifics)
- Never document deprecated endpoints; omit them entirely from the output
- Do not reference internal tools, dashboards, or systems that external developers cannot access
- Do not include authentication tokens, API keys, or credentials in examples (use clearly marked placeholders)

## Audience
- External developers integrating the API into their own applications
- Varying skill levels: from junior developers making their first API integration to senior engineers who just need the endpoint details
- They care about: "How do I call this?", "What do I send?", "What do I get back?", "What can go wrong?"
- They do not care about: why the API was built this way, internal architecture decisions, or version history

## Tone & Voice
- Friendly but precise: approachable without being vague
- Tutorial-style: guide the reader step by step, as if walking them through it in person
- Use second person ("you") to address the developer directly
- Keep sentences short and scannable; use bullet points and code blocks liberally
- Confidence without arrogance: state things clearly, do not hedge unnecessarily

## Domain Terms
- Use "endpoint" (not "route" or "resource") consistently
- Use "request" and "response" (not "input" and "output" when referring to API calls)
- Use "authentication" (not "auth") in prose; "auth" is acceptable only in code examples and headers
- Expand all acronyms on first use (e.g., "JSON (JavaScript Object Notation)")
