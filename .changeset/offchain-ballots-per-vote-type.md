---
"@anticapture/dashboard": minor
---

Rework the off-chain (Snapshot) proposal experience.

Each vote type now renders its own purpose-built ballot: single choice and basic
radio rows, an approval ballot with an "N of M selected" counter, a weighted
ballot with per-option steppers, colored allocation dots, a stacked allocation
bar and a running total that must reach 100% before voting, and a ranked ballot
with drag-to-reorder plus keyboard-accessible chevrons. Option lists longer than
8 entries get a filter input and a fixed-height scroll area. The single-choice
ballot can also show a live impact preview: a per-option bar, voting power and
share, with the shift the vote would cause on the selected row.

Adds the off-chain current-results card: ranked per-option tallies with the
leading option highlighted, shutter-aware encrypted and reveal-pending states
that show dashes instead of zeros, and an optimistic-vote chip that reports
indexing progress after a vote is signed.

Off-chain statuses are now derived on their own terms instead of borrowing the
on-chain enum, so a Snapshot vote can no longer read "Executed". Basic
proposals resolve to a quorum-aware Passed or Rejected, every other vote type
closes with its winner surfaced, and Active is visually distinct from Passed.
