# Voice & Tone

Anticapture communicates governance data. Every word — labels, empty states, error messages, tooltips — must reinforce clarity and trust. This document defines how the product speaks.

---

## Tone Characteristics

| Trait                        | Description                                                      | Example                                                                                            |
| ---------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Precise**                  | Use specific terms. Avoid vague language.                        | "98.7% of voting power held by top 10 delegates" not "highly concentrated"                         |
| **Neutral**                  | Present data without editorialising. Let users draw conclusions. | "Quorum not met in 3 of the last 5 proposals" not "This DAO struggles with participation"          |
| **Direct**                   | Lead with the most important information. No preamble.           | "No proposals in the last 30 days" not "It appears there may not have been any proposals recently" |
| **Technical but accessible** | Use correct governance vocabulary. Avoid unnecessary jargon.     | "Delegate concentration" not "whale centralization"; avoid "on-chain" when "blockchain" suffices   |
| **Calm under failure**       | Error and empty states are informative, not alarming.            | "No data available for this period" not "Something went wrong!"                                    |

---

## Formatting Rules

### Numbers

- Always format large numbers with thousand separators: `1,234,567`
- Percentages: one decimal place — `98.7%`, not `98.72%`
- Token amounts: use abbreviations at scale — `1.2M`, `34K`, never raw `1200000`
- Addresses: truncate to `0x1234…abcd` (4 chars each side)
- Dates: ISO-style where possible — `2024-03-09`; relative for recency — `3 days ago`

### Labels

- Sentence case for UI labels: `Voting power`, not `Voting Power`
- ALL CAPS only for overline/label tokens (e.g., `PROTOCOL OVERVIEW`)
- Avoid acronyms unless widely understood: `DAO` ✓, `VPD` ✗
- Button labels are imperative verbs: `Connect wallet`, `View proposals`, `Export CSV`

### Empty States

```
Title:   {Entity} not found
Body:    There is no {entity} matching your current filters.
Action:  Clear filters  (link/button)
```

```
Title:   No activity yet
Body:    {Entity} will appear here once on-chain events are indexed.
Action:  (none, or: Learn more)
```

### Error Messages

```
Title:   Could not load {data type}
Body:    Check your connection or try again. If the issue persists, contact support.
Action:  Retry
```

- Never expose stack traces or raw API errors to users
- Never say "unexpected error" — identify the failing resource

### Tooltips

- One sentence max. No trailing punctuation unless two sentences are required.
- Describe _what the metric is_, not what the user should _do_ with it.
- Example: `"Percentage of total supply held by top 10 token holders."`

---

## System Message Constraints (AI Alignment)

These rules apply to any AI-generated or AI-assisted text rendered inside Anticapture:

1. **No opinions on governance outcomes.** The system must not express whether a DAO's governance is "good" or "bad". Present data; let users interpret.
2. **Cite sources.** Any AI-generated explanation referencing on-chain data must link to the data source (block explorer, subgraph, API endpoint).
3. **Uncertainty must be explicit.** If an AI analysis is based on incomplete or lagged data, say so: `"Based on data through block 19,500,000."`.
4. **No speculation.** Do not generate text about future governance outcomes or predictions without a confidence interval and methodology note.
5. **Preserve user agency.** System messages must not pressure users toward a specific vote or delegate choice.

---

## AI Text Review Examples

### ✅ Correct

> "Delegate A holds 12.4% of total voting power, up from 8.1% 30 days ago."

> "Quorum was not reached in this proposal. 3.2M votes were cast; 5M were required."

> "No voting activity found for this address in the last 90 days."

### ❌ Incorrect

> "This delegate is gaining dangerous levels of power — you should watch out." (editorialised, alarming)

> "The community seems disengaged with this proposal." (speculative, vague)

> "Things look great! The DAO is very healthy." (opinion, no data)

> "An unexpected error occurred." (vague, unhelpful)

---

## Quick Reference

| Situation      | Voice                                         |
| -------------- | --------------------------------------------- |
| Data label     | Precise, sentence case, no punctuation        |
| Empty state    | Calm, direct, actionable                      |
| Error message  | Factual, calm, always offer a next step       |
| Tooltip        | One sentence, descriptive, no trailing period |
| Button         | Imperative verb, title-case for primary CTAs  |
| AI explanation | Neutral, cited, uncertainty-aware             |
