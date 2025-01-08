export type ActiveSupplyQueryResult = {
    activeSupply: string;
    activeUsers: string;
  };

export type ProposalsCompareQueryResult = {
    currentProposalsLaunched: string;
    oldProposalsLaunched: string;
}

export type VotesCompareQueryResult = {
    currentVotes: string;
    oldVotes: string;
}