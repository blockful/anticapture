export type ActiveSupplyQueryResult = {
  activeSupply: string;
};

export type ProposalsCompareQueryResult = {
  currentProposalsLaunched: number;
  oldProposalsLaunched: number;
};

export type VotesCompareQueryResult = {
  currentVotes: number;
  oldVotes: number;
};

export type AverageTurnoutCompareQueryResult = {
  currentAverageTurnout: number;
  oldAverageTurnout: number;
};
