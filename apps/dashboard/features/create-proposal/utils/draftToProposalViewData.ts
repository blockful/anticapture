import type { ProposalDraft } from "@/features/create-proposal/types";
import { encodeDescription } from "@/features/create-proposal/utils/encodeDescription";
import {
  ProposalStatus,
  type ProposalViewData,
} from "@/features/governance/types";

/** Encoded calldata bundle for the draft's actions (see useEncodedDraftActions). */
export interface EncodedDraftActions {
  targets: Array<string | null>;
  values: Array<string | null>;
  calldatas: Array<string | null>;
}

/**
 * Adapts a draft into `ProposalViewData` for the published-proposal renderers,
 * with on-chain/voting fields zeroed. `description` uses the same
 * `encodeDescription` the publish path submits, so the Preview matches what
 * gets published.
 */
export const draftToProposalViewData = (
  draft: ProposalDraft,
  encoded: EncodedDraftActions,
): ProposalViewData => ({
  id: draft.id,
  daoId: draft.daoId,
  txHash: null,
  proposerAccountId: draft.author as `0x${string}`,
  title: draft.title,
  description: encodeDescription(draft.title, draft.discussionUrl, draft.body),
  quorum: "0",
  timestamp: draft.createdAt,
  status: ProposalStatus.PENDING,
  forVotes: "0",
  againstVotes: "0",
  abstainVotes: "0",
  startTimestamp: 0,
  endTimestamp: 0,
  startBlock: 0,
  endBlock: 0,
  queuedTimestamp: null,
  executedTimestamp: null,
  queuedTxHash: null,
  executedTxHash: null,
  calldatas: encoded.calldatas,
  targets: encoded.targets,
  values: encoded.values,
  proposalType: null,
});
