---
"@anticapture/dashboard": patch
---

Fix proposal descriptions rendering blank for DAOs (e.g. Compound) whose on-chain descriptions use escaped `\n` newlines, by normalizing them to real line breaks for display.
