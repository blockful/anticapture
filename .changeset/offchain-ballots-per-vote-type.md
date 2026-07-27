---
"@anticapture/dashboard": minor
---

Give each off-chain (Snapshot) vote type its own purpose-built ballot: single
choice and basic radio rows, an approval ballot with an "N of M selected"
counter, a weighted ballot with per-option steppers, colored allocation dots, a
stacked allocation bar and a running total that must reach 100% before voting,
and a ranked ballot with drag-to-reorder plus keyboard-accessible chevrons.
Option lists longer than 8 entries now get a filter input and a fixed-height
scroll area.

Also adds the off-chain current-results card: ranked per-option tallies with the
leading option highlighted, shutter-aware encrypted and reveal-pending states
that show dashes instead of zeros, and an optimistic-vote chip that reports
indexing progress after a vote is signed.
