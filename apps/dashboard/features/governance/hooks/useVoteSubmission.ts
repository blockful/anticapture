import { useCallback, useSyncExternalStore } from "react";
import type { Address } from "viem";

import {
  IDLE_SUBMISSION,
  type SubmissionState,
} from "@/features/governance/utils/submissionState";
import {
  readSubmission,
  subscribeToSubmission,
} from "@/features/governance/utils/submissionStore";
import {
  readVoteDetails,
  voteSubmissionKey,
  type VoteDetails,
} from "@/features/governance/utils/voteSubmission";

interface UseVoteSubmissionResult {
  /** Null until there is both a voter and a proposal to key the vote by. */
  key: string | null;
  submission: SubmissionState;
  details: VoteDetails;
}

/**
 * The connected wallet's vote on one proposal, read from the page-lifetime
 * store, so the modal and the proposal page agree on it through any close,
 * reopen or remount.
 */
export const useVoteSubmission = (
  daoId: string,
  proposalId: string | undefined,
  voter: Address | undefined,
): UseVoteSubmissionResult => {
  const key =
    voter && proposalId ? voteSubmissionKey(daoId, proposalId, voter) : null;

  const subscribe = useCallback(
    (onChange: () => void) =>
      key ? subscribeToSubmission(key, onChange) : () => {},
    [key],
  );
  const read = useCallback(
    () => (key ? readSubmission(key) : IDLE_SUBMISSION),
    [key],
  );
  const submission = useSyncExternalStore(subscribe, read, read);

  return {
    key,
    submission,
    details: key
      ? readVoteDetails(key)
      : { support: null, alreadyVoted: false },
  };
};
