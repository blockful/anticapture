import { CheckCircle2 } from "lucide-react";

import { Button } from "@/shared/components";

interface VoteAlreadyCastContentProps {
  onClose: () => void;
}

/**
 * The governor already holds a vote from this address, so the ballot on
 * screen was never cast. Ends the flow with a way out rather than the ballot,
 * which could only send the same refusal again.
 */
export const VoteAlreadyCastContent = ({
  onClose,
}: VoteAlreadyCastContentProps) => (
  <div className="flex flex-col items-center gap-3 px-4 py-8">
    <div className="bg-surface-opacity-success flex size-12 items-center justify-center rounded-full">
      <CheckCircle2 className="text-success size-6" />
    </div>

    <h3 className="text-primary text-center text-lg font-medium">
      You have already voted on this proposal
    </h3>

    <p className="text-secondary max-w-sm text-center text-sm leading-5">
      Your earlier vote is the one that counts. It shows on this page once it is
      indexed.
    </p>

    <Button variant="outline" onClick={onClose}>
      Close
    </Button>
  </div>
);
