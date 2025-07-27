export interface DAOClient {
  getVotingDelay: () => Promise<bigint>;
  getVotingPeriod: () => Promise<bigint>;
  getTimelockDelay: () => Promise<bigint>;
  getQuorum: () => Promise<bigint>;
  getProposalThreshold: () => Promise<bigint>;
  getBlockTime: (blockNumber: number) => Promise<number | null>;
  calculateQuorum: (votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }) => bigint;
}
