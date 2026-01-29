export * from "./ens";
export * from "./op";
export * from "./gtc";
export * from "./nouns";
export * from "./scr";
export * from "./comp";
export * from "./obol";
export * from "./zk";
export * from "./uni";

export interface DAOClient {
  getDaoId: () => string;
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
  getProposalStatus: (proposal: {
    id: string;
    status: string;
    startBlock: number;
    endBlock: number;
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }) => Promise<string>;
}
