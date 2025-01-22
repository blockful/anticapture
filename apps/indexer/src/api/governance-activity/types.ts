export type ActiveSupplyQueryResult = {
  activeSupply: string;
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
