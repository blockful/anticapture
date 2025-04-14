export interface Governor {
  getVotingDelay: () => Promise<bigint>;
  getVotingPeriod: () => Promise<bigint>;
  getTimelockDelay: () => Promise<bigint>;
  getQuorum: () => Promise<bigint>;
  getProposalThreshold: () => Promise<bigint>;
}
