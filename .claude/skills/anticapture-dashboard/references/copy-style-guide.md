# Anticapture Copy Style Guide

This document is the single source of truth for copy consistency across the anticapture.com platform. It is used by the CI/CD copy review agent to evaluate PRs.

---

## Voice & Tone

**Primary voice:** Professional-authoritative. Anticapture is a governance security platform — copy should inspire confidence and clarity.

- Lead with what the metric **does** (protection framing), not what could go wrong (fear framing)
- Use active voice: "Protects the system from..." not "The system is protected by..."
- Avoid jargon without context. If a term is in the Glossary, it can be used freely. Otherwise, explain briefly on first use.
- Cyberpunk/hacker tone is reserved for the home page UI accents only. Dashboard, tooltips, configs, and analytics copy must stay professional.

---

## Terminology

### Canonical terms (always use these)

| Correct term             | Never use                             | Context                                                           |
| ------------------------ | ------------------------------------- | ----------------------------------------------------------------- |
| Attack Exposure          | Risk Areas, Risk Analysis             | Section name for the collection of defense categories             |
| Economic Security        | Attack Profitability (as a risk area) | Risk area / defense category name                                 |
| Spam Resistance          | Spam Vulnerable                       | Risk area name                                                    |
| Contract Safety          | Hackable                              | Risk area name                                                    |
| Gov Front-end Resilience | Gov Front-end Vulnerability           | Risk area name                                                    |
| Interface Resilience     | Interface Hijack                      | Governance implementation metric name                             |
| attack exposure          | risk area                             | When referring to individual items in the Attack Exposure section |

### Allowed dual usage

| Term                 | As a risk area                       | As a metric/column                                                               |
| -------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| Attack Profitability | DO NOT USE (use "Economic Security") | ALLOWED as the PanelTable column header and GovernanceImplementation metric name |

"Attack Profitability" refers to the specific governance implementation metric under the "Economic Security" risk area. The risk area is the broad category; the metric is the specific measurement. Do not flag this distinction as a naming collision.

### Risk level labels

| Level        | Display format   |
| ------------ | ---------------- |
| HIGH         | `[HIGH RISK]`    |
| MEDIUM       | `[MEDIUM RISK]`  |
| LOW          | `[LOW RISK]`     |
| NONE/UNKNOWN | `[UNKNOWN RISK]` |

### Stage labels

| Stage    | Short                   | Description                                                               |
| -------- | ----------------------- | ------------------------------------------------------------------------- |
| Stage 0  | `STAGE 0 [HIGH RISK]`   | At least one implementation detail identified as High Risk                |
| Stage 1  | `STAGE 1 [MEDIUM RISK]` | Resolved all High Risk issues; at least one Medium Risk remains           |
| Stage 2  | `STAGE 2 [LOW RISK]`    | Achieved the highest level of governance security                         |
| No Stage | `[no stage]`            | DAO not eligible — doesn't use governor/timelock for autonomous execution |

### Abbreviations

| Abbreviation | Full name                |
| ------------ | ------------------------ |
| SR           | Spam Resistance          |
| ES           | Economic Security        |
| CS           | Contract Safety          |
| GR           | Gov Front-end Resilience |
| SG           | Safeguards               |
| RT           | Response Time            |

---

## Formatting Rules

### Punctuation

- **Trailing periods:** All `currentSetting`, `impact`, `nextStep`, and `description` fields MUST end with a period.
- **Decimal separators:** Always use a period (`.`) — never a comma. `0.9%` not `0,9%`.
- **Dashes:** Use em dash `—` for parenthetical breaks in prose. Do not use double hyphens `--`.
- **Possessives:** `users' funds` (plural possessive), not `users funds`.

### Numbers and percentages

- Use `%` symbol, not the word "percent"
- Decimal separators: period only (`.`)
- Large numbers in tooltips: use `formatNumberUserReadable()` output conventions
- Token amounts: `100K $ENS`, `1M $UNI`, `3 Nouns` — include `$` prefix for fungible tokens

### Grammar

- "an" before vowel sounds: "an immutable manner", "an attacker"
- "take over" (verb, two words) vs "takeover" (noun, one word)
- "has no" not "has not" when followed by a noun: "has no Veto Strategy"
- Subject-verb agreement: "issues need fixing" not "issues needs fixing"

---

## Per-DAO Config Rules

### Cross-reference accuracy

Every `currentSetting`, `impact`, `nextStep`, and `attackExposure.defenseAreas` description MUST reference only its own DAO. Specifically:

- `nextStep` must name the correct DAO (not a copy-paste from another DAO's config)
- `currentSetting` must reference the correct governance token (`$COMP`, `$ENS`, `$GTC`, `$OBOL`, `$OP`, `$SCR`, `$UNI`, or Nouns NFTs)
- `impact` must describe the correct DAO's situation
- `defenseAreas` descriptions must not name a different DAO

### nextStep consistency with riskLevel

- If `riskLevel` is `LOW` → `nextStep` MAY say "The parameter is in its lowest-risk condition."
- If `riskLevel` is `MEDIUM` or `HIGH` → `nextStep` MUST describe the specific action needed to reduce risk. It must NEVER say "lowest-risk condition."
- Cross-check: if `currentSetting` describes a vulnerability and `impact` describes risk, `nextStep` cannot claim lowest-risk.

### Hardcoded values

Avoid hardcoding dollar figures (e.g., "$2.7B") in `impact` or `currentSetting` fields. These go stale as TVL and market conditions change. Use general framing instead.

### N/A tooltip accuracy

When a cell shows "N/A" for Cost of Attack or Attack Profitability:

- Use the `attackExposure.defenseAreas[ECONOMIC_SECURITY].description` from the DAO config as the tooltip source
- If an ES description exists, show it (it already differentiates between multisig DAOs and DAOs where data isn't wired up)
- Only fall back to the generic "treasury is controlled by a multisig" text if no ES description exists
- NEVER assume that a missing data integration (`supportsLiquidTreasuryCall` = false) means multisig protection

---

## Tooltip & Column Rules

### Column header tooltips

- Must accurately describe what the formula calculates — do not claim inputs that aren't in the code
- If the formula uses only liquid treasury, do not say "treasury and TVL"
- Simplified language is acceptable (e.g., "capital required" as a proxy description is fine), but inputs must be truthful

### Calculation methodology

- Document time window mismatches when different inputs use different intervals
- Active supply: 90-day window
- Treasury: 7-day window
- These differences should be noted if surfaced to users

---

## What the Copy Review Agent Should Flag

### Always flag

1. **Wrong DAO references** — a config mentioning a different DAO's name, token, or delegates
2. **Tooltip vs formula mismatches** — tooltip describes inputs not used in the calculation
3. **riskLevel / nextStep contradictions** — MEDIUM or HIGH risk claiming "lowest-risk condition"
4. **Grammar errors** — "a immutable", "has not Veto", subject-verb disagreement
5. **Formatting inconsistencies** — missing periods, comma decimals, wrong dash style
6. **Framework accuracy** — metric descriptions that contradict the Anticapture Framework thresholds
7. **N/A tooltip accuracy** — verify each DAO's N/A state against its actual config data
8. **Contradictory sentences** — impact text that says opposite things in the same sentence

### Never flag

1. **Metric vs risk area naming** — "Attack Profitability" as a column and "Economic Security" as a risk area are intentionally distinct
2. **UX micro-decisions** — clamping negative values to $0, display formatting choices
3. **Dead code** — unused variables or return values are code review concerns, not copy review
4. **Removed features** — deleted banners, CTAs, or sections are product decisions unless they leave orphaned references
5. **Proxy metric precision** — simplified descriptions of calculation methodology in tooltips are acceptable for dashboard context

### Report format

Every finding MUST include:

1. **Exact file path** and approximate source line number
2. **Field name** (e.g., `INTERFACE_RESILIENCE.nextStep`)
3. **Current text** — the exact string as it appears
4. **Fix** — the exact replacement text or clear instruction
5. **Severity** — Critical / High / Cleanup / Polish

Findings must be structured so a developer (human or AI) can locate and fix each issue without additional searching.
