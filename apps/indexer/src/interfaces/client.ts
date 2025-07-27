export interface DAOClient {
  getVotingDelay: () => Promise<bigint>;
  getVotingPeriod: () => Promise<bigint>;
  getTimelockDelay: () => Promise<bigint>;
  getQuorum: (proposalId: string | null) => Promise<bigint>;
  getProposalThreshold: () => Promise<bigint>;
  getCurrentBlockNumber: () => Promise<number>;
  getBlockTime: (blockNumber: number) => Promise<number | null>;
  calculateQuorum: (votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }) => bigint;
}
