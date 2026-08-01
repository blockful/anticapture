"use client";

import { AllocationVoteOptions } from "./AllocationVoteOptions";

interface QuadraticVoteOptionsProps {
  choices: string[];
  value: Record<string, number> | null;
  onChange: (choice: Record<string, number>) => void;
}

/**
 * Quadratic ballots have no dedicated frame — they reuse the weighted allocation
 * ballot, with the n² credit cost surfaced as a dimmed second line per option.
 */
export const QuadraticVoteOptions = (props: QuadraticVoteOptionsProps) => (
  <AllocationVoteOptions
    {...props}
    renderSecondaryLine={(weight) =>
      weight > 0 ? `${weight}² = ${weight * weight} credits` : null
    }
  />
);
