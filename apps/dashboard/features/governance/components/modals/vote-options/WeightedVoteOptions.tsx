"use client";

import { AllocationVoteOptions } from "./AllocationVoteOptions";

interface WeightedVoteOptionsProps {
  choices: string[];
  value: Record<string, number> | null;
  onChange: (choice: Record<string, number>) => void;
}

export const WeightedVoteOptions = (props: WeightedVoteOptionsProps) => (
  <AllocationVoteOptions {...props} />
);
