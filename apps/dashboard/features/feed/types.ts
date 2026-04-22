import type { Address } from "viem";

export interface VoteDetail {
  voter: Address;
  votingPower: string;
  proposalId: string;
  title: string | null;
  support: number;
}

export interface ProposalDetail {
  id: string;
  title: string;
  proposer: Address;
  votingPower: string;
}

export interface ProposalExtendedDetail {
  id: string;
  title: string;
  endBlock: number;
  endTimestamp: number;
  proposer: Address;
}

export interface TransferDetail {
  from: Address;
  to: Address;
  amount: string;
}

export interface DelegationDetail {
  delegator: Address;
  delegate: Address;
  previousDelegate: Address | null;
  amount: string;
}

export interface DelegationVotesChangedDetail {
  delta: string;
  deltaMod: string;
  delegate: Address;
}
