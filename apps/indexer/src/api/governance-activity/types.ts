export type ActiveSupplyQueryResult = {
  currentActiveSupply: string;
  oldActiveSupply: string;
  changeRate: string;
};

export type ProposalsCompareQueryResult = {
  currentProposalsLaunched: string;
  oldProposalsLaunched: string;
};

export type VotesCompareQueryResult = {
  currentVotes: string;
  oldVotes: string;
};

export type AverageTurnoutCompareQueryResult = {
  currentAverageTurnout: string;
  oldAverageTurnout: string;
};
