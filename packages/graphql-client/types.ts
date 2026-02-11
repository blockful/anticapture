export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
  NonNegativeInt: { input: any; output: any; }
  ObjMap: { input: any; output: any; }
  PositiveInt: { input: any; output: any; }
};

export type AverageDelegationPercentageItem = {
  __typename?: 'AverageDelegationPercentageItem';
  date: Scalars['String']['output'];
  high: Scalars['String']['output'];
};

export type AverageDelegationPercentagePage = {
  __typename?: 'AverageDelegationPercentagePage';
  items: Array<AverageDelegationPercentageItem>;
  pageInfo: PageInfo;
  /**
   * The actual number of items returned in this response.
   * May be less than requested if DAOs don't have overlapping data for the full date range.
   */
  totalCount: Scalars['Int']['output'];
};

export type DaoList = {
  __typename?: 'DAOList';
  items: Array<Dao_200_Response>;
  totalCount: Scalars['Int']['output'];
};

export enum HttpMethod {
  Connect = 'CONNECT',
  Delete = 'DELETE',
  Get = 'GET',
  Head = 'HEAD',
  Options = 'OPTIONS',
  Patch = 'PATCH',
  Post = 'POST',
  Put = 'PUT',
  Trace = 'TRACE'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  endDate?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startDate?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  /** Returns account balance information for a specific address */
  accountBalanceByAccountId?: Maybe<AccountBalanceByAccountId_200_Response>;
  /** Returns a mapping of the biggest variations to account balances associated by account address */
  accountBalanceVariations?: Maybe<AccountBalanceVariations_200_Response>;
  /** Returns a the changes to balance by period and accountId */
  accountBalanceVariationsByAccountId?: Maybe<AccountBalanceVariationsByAccountId_200_Response>;
  /** Returns sorted and paginated account balance records */
  accountBalances?: Maybe<AccountBalances_200_Response>;
  /**
   * Returns a mapping of the largest interactions between accounts.
   * Positive amounts signify net token transfers FROM <address>, whilst negative amounts refer to net transfers TO <address>
   */
  accountInteractions?: Maybe<AccountInteractions_200_Response>;
  /**
   * Average delegation percentage across all supported DAOs by day.
   * Returns the mean delegation percentage for each day in the specified range.
   * Only includes dates where ALL DAOs have data available.
   */
  averageDelegationPercentageByDay: AverageDelegationPercentagePage;
  /** Get active token supply for DAO */
  compareActiveSupply?: Maybe<CompareActiveSupply_200_Response>;
  /** Compare average turnout between time periods */
  compareAverageTurnout?: Maybe<CompareAverageTurnout_200_Response>;
  /** Compare cex supply between periods */
  compareCexSupply?: Maybe<CompareCexSupply_200_Response>;
  /** Compare circulating supply between periods */
  compareCirculatingSupply?: Maybe<CompareCirculatingSupply_200_Response>;
  /** Compare delegated supply between periods */
  compareDelegatedSupply?: Maybe<CompareDelegatedSupply_200_Response>;
  /** Compare dex supply between periods */
  compareDexSupply?: Maybe<CompareDexSupply_200_Response>;
  /** Compare lending supply between periods */
  compareLendingSupply?: Maybe<CompareLendingSupply_200_Response>;
  /** Compare number of proposals between time periods */
  compareProposals?: Maybe<CompareProposals_200_Response>;
  /** Compare total supply between periods */
  compareTotalSupply?: Maybe<CompareTotalSupply_200_Response>;
  /** Compare treasury between periods */
  compareTreasury?: Maybe<CompareTreasury_200_Response>;
  /** Compare number of votes between time periods */
  compareVotes?: Maybe<CompareVotes_200_Response>;
  /** Returns current governance parameters for this DAO */
  dao?: Maybe<Dao_200_Response>;
  /** Get all DAOs */
  daos: DaoList;
  /** Get delegation percentage day buckets with forward-fill */
  delegationPercentageByDay?: Maybe<DelegationPercentageByDay_200_Response>;
  /** Get current delegators of an account */
  delegations?: Maybe<Delegations_200_Response>;
  /** Get historical DAO Token Treasury value (governance token quantity × token price) */
  getDaoTokenTreasury?: Maybe<GetDaoTokenTreasury_200_Response>;
  /** Get historical Liquid Treasury (treasury without DAO tokens) from external providers (DefiLlama/Dune) */
  getLiquidTreasury?: Maybe<GetLiquidTreasury_200_Response>;
  /** Get historical Total Treasury (liquid treasury + DAO token treasury) */
  getTotalTreasury?: Maybe<GetTotalTreasury_200_Response>;
  /** TODO */
  historicalBalances?: Maybe<HistoricalBalances_200_Response>;
  /** Get historical delegations for an account, with optional filtering and sorting */
  historicalDelegations?: Maybe<HistoricalDelegations_200_Response>;
  /** Get historical market data for a specific token */
  historicalTokenData?: Maybe<Array<Maybe<Query_HistoricalTokenData_Items>>>;
  /** Returns a list of voting power changes. */
  historicalVotingPower?: Maybe<HistoricalVotingPower_200_Response>;
  /** Returns a list of voting power changes for a specific account */
  historicalVotingPowerByAccountId?: Maybe<HistoricalVotingPowerByAccountId_200_Response>;
  /** Get the last update time */
  lastUpdate?: Maybe<LastUpdate_200_Response>;
  /** Returns a single proposal by its ID */
  proposal?: Maybe<Proposal_200_Response>;
  /** Returns the active delegates that did not vote on a given proposal */
  proposalNonVoters?: Maybe<ProposalNonVoters_200_Response>;
  /** Returns a list of proposal */
  proposals?: Maybe<Proposals_200_Response>;
  /** Returns proposal activity data including voting history, win rates, and detailed proposal information for the specified delegate within the given time window */
  proposalsActivity?: Maybe<ProposalsActivity_200_Response>;
  /** Get property data for a specific token */
  token?: Maybe<Token_200_Response>;
  /** Returns token related metrics for a single metric type. */
  tokenMetrics?: Maybe<TokenMetrics_200_Response>;
  /** Get transactions with their associated transfers and delegations, with optional filtering and sorting */
  transactions?: Maybe<Transactions_200_Response>;
  /** Get transfers of a given address */
  transfers?: Maybe<Transfers_200_Response>;
  /** Get all votes ordered by timestamp or voting power */
  votes?: Maybe<Votes_200_Response>;
  /** Returns a paginated list of votes cast on a specific proposal */
  votesByProposalId?: Maybe<VotesByProposalId_200_Response>;
  /** Returns voting power information for a specific address (account) */
  votingPowerByAccountId?: Maybe<VotingPowerByAccountId_200_Response>;
  /** Returns a mapping of the voting power changes within a time frame for the given addresses */
  votingPowerVariations?: Maybe<VotingPowerVariations_200_Response>;
  /** Returns a the changes to voting power by period and accountId */
  votingPowerVariationsByAccountId?: Maybe<VotingPowerVariationsByAccountId_200_Response>;
  /** Returns sorted and paginated account voting power records */
  votingPowers?: Maybe<VotingPowers_200_Response>;
};


export type QueryAccountBalanceByAccountIdArgs = {
  address: Scalars['String']['input'];
};


export type QueryAccountBalanceVariationsArgs = {
  addresses?: InputMaybe<Scalars['JSON']['input']>;
  fromDate?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderDirection?: InputMaybe<QueryInput_AccountBalanceVariations_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAccountBalanceVariationsByAccountIdArgs = {
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAccountBalancesArgs = {
  addresses?: InputMaybe<Scalars['JSON']['input']>;
  delegates?: InputMaybe<Scalars['JSON']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderDirection?: InputMaybe<QueryInput_AccountBalances_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAccountInteractionsArgs = {
  address: Scalars['String']['input'];
  filterAddress?: InputMaybe<Scalars['String']['input']>;
  fromDate?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  maxAmount?: InputMaybe<Scalars['String']['input']>;
  minAmount?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<QueryInput_AccountInteractions_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_AccountInteractions_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAverageDelegationPercentageByDayArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  startDate: Scalars['String']['input'];
};


export type QueryCompareActiveSupplyArgs = {
  days?: InputMaybe<QueryInput_CompareActiveSupply_Days>;
};


export type QueryCompareAverageTurnoutArgs = {
  days?: InputMaybe<QueryInput_CompareAverageTurnout_Days>;
};


export type QueryCompareCexSupplyArgs = {
  days?: InputMaybe<QueryInput_CompareCexSupply_Days>;
};


export type QueryCompareCirculatingSupplyArgs = {
  days?: InputMaybe<QueryInput_CompareCirculatingSupply_Days>;
};


export type QueryCompareDelegatedSupplyArgs = {
  days?: InputMaybe<QueryInput_CompareDelegatedSupply_Days>;
};


export type QueryCompareDexSupplyArgs = {
  days?: InputMaybe<QueryInput_CompareDexSupply_Days>;
};


export type QueryCompareLendingSupplyArgs = {
  days?: InputMaybe<QueryInput_CompareLendingSupply_Days>;
};


export type QueryCompareProposalsArgs = {
  days?: InputMaybe<QueryInput_CompareProposals_Days>;
};


export type QueryCompareTotalSupplyArgs = {
  days?: InputMaybe<QueryInput_CompareTotalSupply_Days>;
};


export type QueryCompareTreasuryArgs = {
  days?: InputMaybe<QueryInput_CompareTreasury_Days>;
};


export type QueryCompareVotesArgs = {
  days?: InputMaybe<QueryInput_CompareVotes_Days>;
};


export type QueryDelegationPercentageByDayArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  orderDirection?: InputMaybe<QueryInput_DelegationPercentageByDay_OrderDirection>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryDelegationsArgs = {
  address: Scalars['String']['input'];
};


export type QueryGetDaoTokenTreasuryArgs = {
  days?: InputMaybe<QueryInput_GetDaoTokenTreasury_Days>;
  order?: InputMaybe<QueryInput_GetDaoTokenTreasury_Order>;
};


export type QueryGetLiquidTreasuryArgs = {
  days?: InputMaybe<QueryInput_GetLiquidTreasury_Days>;
  order?: InputMaybe<QueryInput_GetLiquidTreasury_Order>;
};


export type QueryGetTotalTreasuryArgs = {
  days?: InputMaybe<QueryInput_GetTotalTreasury_Days>;
  order?: InputMaybe<QueryInput_GetTotalTreasury_Order>;
};


export type QueryHistoricalBalancesArgs = {
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['String']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<QueryInput_HistoricalBalances_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_HistoricalBalances_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};


export type QueryHistoricalDelegationsArgs = {
  address: Scalars['String']['input'];
  delegateAddressIn?: InputMaybe<Scalars['JSON']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderDirection?: InputMaybe<QueryInput_HistoricalDelegations_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};


export type QueryHistoricalTokenDataArgs = {
  limit?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
};


export type QueryHistoricalVotingPowerArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  fromDate?: InputMaybe<Scalars['String']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<QueryInput_HistoricalVotingPower_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_HistoricalVotingPower_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};


export type QueryHistoricalVotingPowerByAccountIdArgs = {
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['String']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<QueryInput_HistoricalVotingPowerByAccountId_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_HistoricalVotingPowerByAccountId_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};


export type QueryLastUpdateArgs = {
  chart: QueryInput_LastUpdate_Chart;
};


export type QueryProposalArgs = {
  id: Scalars['String']['input'];
};


export type QueryProposalNonVotersArgs = {
  addresses?: InputMaybe<Scalars['JSON']['input']>;
  id: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderDirection?: InputMaybe<QueryInput_ProposalNonVoters_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
};


export type QueryProposalsArgs = {
  fromDate?: InputMaybe<Scalars['Float']['input']>;
  fromEndDate?: InputMaybe<Scalars['Float']['input']>;
  includeOptimisticProposals?: InputMaybe<QueryInput_Proposals_IncludeOptimisticProposals>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderDirection?: InputMaybe<QueryInput_Proposals_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  status?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryProposalsActivityArgs = {
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<QueryInput_ProposalsActivity_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_ProposalsActivity_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  userVoteFilter?: InputMaybe<QueryInput_ProposalsActivity_UserVoteFilter>;
};


export type QueryTokenArgs = {
  currency?: InputMaybe<QueryInput_Token_Currency>;
};


export type QueryTokenMetricsArgs = {
  endDate?: InputMaybe<Scalars['Float']['input']>;
  limit?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  metricType: QueryInput_TokenMetrics_MetricType;
  orderDirection?: InputMaybe<QueryInput_TokenMetrics_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  startDate?: InputMaybe<Scalars['Float']['input']>;
};


export type QueryTransactionsArgs = {
  affectedSupply?: InputMaybe<Scalars['JSON']['input']>;
  from?: InputMaybe<Scalars['String']['input']>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  includes?: InputMaybe<Scalars['JSON']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  maxAmount?: InputMaybe<Scalars['String']['input']>;
  minAmount?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  sortBy?: InputMaybe<Timestamp_Const>;
  sortOrder?: InputMaybe<QueryInput_Transactions_SortOrder>;
  to?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTransfersArgs = {
  address: Scalars['String']['input'];
  from?: InputMaybe<Scalars['String']['input']>;
  fromDate?: InputMaybe<Scalars['Float']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Float']['input']>;
  offset?: InputMaybe<Scalars['Float']['input']>;
  sortBy?: InputMaybe<QueryInput_Transfers_SortBy>;
  sortOrder?: InputMaybe<QueryInput_Transfers_SortOrder>;
  to?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['Float']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};


export type QueryVotesArgs = {
  fromDate?: InputMaybe<Scalars['Float']['input']>;
  limit?: InputMaybe<Scalars['Float']['input']>;
  orderBy?: InputMaybe<QueryInput_Votes_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_Votes_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  support?: InputMaybe<Scalars['Float']['input']>;
  toDate?: InputMaybe<Scalars['Float']['input']>;
  voterAddressIn?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryVotesByProposalIdArgs = {
  fromDate?: InputMaybe<Scalars['Float']['input']>;
  id: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Float']['input']>;
  orderBy?: InputMaybe<QueryInput_VotesByProposalId_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_VotesByProposalId_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  support?: InputMaybe<Scalars['Float']['input']>;
  toDate?: InputMaybe<Scalars['Float']['input']>;
  voterAddressIn?: InputMaybe<Scalars['JSON']['input']>;
};


export type QueryVotingPowerByAccountIdArgs = {
  accountId: Scalars['String']['input'];
};


export type QueryVotingPowerVariationsArgs = {
  addresses?: InputMaybe<Scalars['JSON']['input']>;
  fromDate?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderDirection?: InputMaybe<QueryInput_VotingPowerVariations_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryVotingPowerVariationsByAccountIdArgs = {
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryVotingPowersArgs = {
  addresses?: InputMaybe<Scalars['JSON']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<QueryInput_VotingPowers_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_VotingPowers_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};

export type AccountBalanceByAccountId_200_Response = {
  __typename?: 'accountBalanceByAccountId_200_response';
  address: Scalars['String']['output'];
  balance: Scalars['String']['output'];
  delegate: Scalars['String']['output'];
  tokenId: Scalars['String']['output'];
};

export type AccountBalanceVariationsByAccountId_200_Response = {
  __typename?: 'accountBalanceVariationsByAccountId_200_response';
  data: Query_AccountBalanceVariationsByAccountId_Data;
  period: Query_AccountBalanceVariationsByAccountId_Period;
};

export type AccountBalanceVariations_200_Response = {
  __typename?: 'accountBalanceVariations_200_response';
  items: Array<Maybe<Query_AccountBalanceVariations_Items_Items>>;
  period: Query_AccountBalanceVariations_Period;
};

export type AccountBalances_200_Response = {
  __typename?: 'accountBalances_200_response';
  items: Array<Maybe<Query_AccountBalances_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export type AccountInteractions_200_Response = {
  __typename?: 'accountInteractions_200_response';
  items: Array<Maybe<Query_AccountInteractions_Items_Items>>;
  period: Query_AccountInteractions_Period;
  totalCount: Scalars['Float']['output'];
};

export type CompareActiveSupply_200_Response = {
  __typename?: 'compareActiveSupply_200_response';
  activeSupply: Scalars['String']['output'];
};

export type CompareAverageTurnout_200_Response = {
  __typename?: 'compareAverageTurnout_200_response';
  changeRate: Scalars['Float']['output'];
  currentAverageTurnout: Scalars['String']['output'];
  oldAverageTurnout: Scalars['String']['output'];
};

export type CompareCexSupply_200_Response = {
  __typename?: 'compareCexSupply_200_response';
  changeRate: Scalars['Float']['output'];
  currentCexSupply: Scalars['String']['output'];
  oldCexSupply: Scalars['String']['output'];
};

export type CompareCirculatingSupply_200_Response = {
  __typename?: 'compareCirculatingSupply_200_response';
  changeRate: Scalars['Float']['output'];
  currentCirculatingSupply: Scalars['String']['output'];
  oldCirculatingSupply: Scalars['String']['output'];
};

export type CompareDelegatedSupply_200_Response = {
  __typename?: 'compareDelegatedSupply_200_response';
  changeRate: Scalars['Float']['output'];
  currentDelegatedSupply: Scalars['String']['output'];
  oldDelegatedSupply: Scalars['String']['output'];
};

export type CompareDexSupply_200_Response = {
  __typename?: 'compareDexSupply_200_response';
  changeRate: Scalars['Float']['output'];
  currentDexSupply: Scalars['String']['output'];
  oldDexSupply: Scalars['String']['output'];
};

export type CompareLendingSupply_200_Response = {
  __typename?: 'compareLendingSupply_200_response';
  changeRate: Scalars['Float']['output'];
  currentLendingSupply: Scalars['String']['output'];
  oldLendingSupply: Scalars['String']['output'];
};

export type CompareProposals_200_Response = {
  __typename?: 'compareProposals_200_response';
  changeRate: Scalars['Float']['output'];
  currentProposalsLaunched: Scalars['Float']['output'];
  oldProposalsLaunched: Scalars['Float']['output'];
};

export type CompareTotalSupply_200_Response = {
  __typename?: 'compareTotalSupply_200_response';
  changeRate: Scalars['Float']['output'];
  currentTotalSupply: Scalars['String']['output'];
  oldTotalSupply: Scalars['String']['output'];
};

export type CompareTreasury_200_Response = {
  __typename?: 'compareTreasury_200_response';
  changeRate: Scalars['Float']['output'];
  currentTreasury: Scalars['String']['output'];
  oldTreasury: Scalars['String']['output'];
};

export type CompareVotes_200_Response = {
  __typename?: 'compareVotes_200_response';
  changeRate: Scalars['Float']['output'];
  currentVotes: Scalars['Float']['output'];
  oldVotes: Scalars['Float']['output'];
};

export type Dao_200_Response = {
  __typename?: 'dao_200_response';
  chainId: Scalars['Float']['output'];
  id: Scalars['String']['output'];
  proposalThreshold: Scalars['String']['output'];
  quorum: Scalars['String']['output'];
  timelockDelay: Scalars['String']['output'];
  votingDelay: Scalars['String']['output'];
  votingPeriod: Scalars['String']['output'];
};

export type DelegationPercentageByDay_200_Response = {
  __typename?: 'delegationPercentageByDay_200_response';
  items: Array<Maybe<Query_DelegationPercentageByDay_Items_Items>>;
  pageInfo: Query_DelegationPercentageByDay_PageInfo;
  totalCount: Scalars['Float']['output'];
};

export type Delegations_200_Response = {
  __typename?: 'delegations_200_response';
  items: Array<Maybe<Query_Delegations_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export type GetDaoTokenTreasury_200_Response = {
  __typename?: 'getDaoTokenTreasury_200_response';
  items: Array<Maybe<Query_GetDaoTokenTreasury_Items_Items>>;
  /** Total number of items */
  totalCount: Scalars['Float']['output'];
};

export type GetLiquidTreasury_200_Response = {
  __typename?: 'getLiquidTreasury_200_response';
  items: Array<Maybe<Query_GetLiquidTreasury_Items_Items>>;
  /** Total number of items */
  totalCount: Scalars['Float']['output'];
};

export type GetTotalTreasury_200_Response = {
  __typename?: 'getTotalTreasury_200_response';
  items: Array<Maybe<Query_GetTotalTreasury_Items_Items>>;
  /** Total number of items */
  totalCount: Scalars['Float']['output'];
};

export type HistoricalBalances_200_Response = {
  __typename?: 'historicalBalances_200_response';
  items: Array<Maybe<Query_HistoricalBalances_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export type HistoricalDelegations_200_Response = {
  __typename?: 'historicalDelegations_200_response';
  items: Array<Maybe<Query_HistoricalDelegations_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export type HistoricalVotingPowerByAccountId_200_Response = {
  __typename?: 'historicalVotingPowerByAccountId_200_response';
  items: Array<Maybe<Query_HistoricalVotingPowerByAccountId_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export type HistoricalVotingPower_200_Response = {
  __typename?: 'historicalVotingPower_200_response';
  items: Array<Maybe<Query_HistoricalVotingPower_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export type LastUpdate_200_Response = {
  __typename?: 'lastUpdate_200_response';
  lastUpdate: Scalars['String']['output'];
};

export type ProposalNonVoters_200_Response = {
  __typename?: 'proposalNonVoters_200_response';
  items: Array<Maybe<Query_ProposalNonVoters_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export type Proposal_200_Response = {
  __typename?: 'proposal_200_response';
  abstainVotes: Scalars['String']['output'];
  againstVotes: Scalars['String']['output'];
  calldatas: Array<Maybe<Scalars['String']['output']>>;
  daoId: Scalars['String']['output'];
  description: Scalars['String']['output'];
  endBlock: Scalars['Float']['output'];
  endTimestamp: Scalars['String']['output'];
  forVotes: Scalars['String']['output'];
  id: Scalars['String']['output'];
  proposalType?: Maybe<Scalars['Float']['output']>;
  proposerAccountId: Scalars['String']['output'];
  quorum: Scalars['String']['output'];
  startBlock: Scalars['Float']['output'];
  startTimestamp: Scalars['String']['output'];
  status: Scalars['String']['output'];
  targets: Array<Maybe<Scalars['String']['output']>>;
  timestamp: Scalars['String']['output'];
  title: Scalars['String']['output'];
  txHash: Scalars['String']['output'];
  values: Array<Maybe<Scalars['String']['output']>>;
};

export type ProposalsActivity_200_Response = {
  __typename?: 'proposalsActivity_200_response';
  address: Scalars['String']['output'];
  avgTimeBeforeEnd: Scalars['Float']['output'];
  neverVoted: Scalars['Boolean']['output'];
  proposals: Array<Maybe<Query_ProposalsActivity_Proposals_Items>>;
  totalProposals: Scalars['Float']['output'];
  votedProposals: Scalars['Float']['output'];
  winRate: Scalars['Float']['output'];
  yesRate: Scalars['Float']['output'];
};

export type Proposals_200_Response = {
  __typename?: 'proposals_200_response';
  items: Array<Maybe<Query_Proposals_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export enum QueryInput_AccountBalanceVariations_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_AccountBalances_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_AccountInteractions_OrderBy {
  Count = 'count',
  Volume = 'volume'
}

export enum QueryInput_AccountInteractions_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_CompareActiveSupply_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_CompareAverageTurnout_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_CompareCexSupply_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_CompareCirculatingSupply_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_CompareDelegatedSupply_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_CompareDexSupply_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_CompareLendingSupply_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_CompareProposals_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_CompareTotalSupply_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_CompareTreasury_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_CompareVotes_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_DelegationPercentageByDay_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_GetDaoTokenTreasury_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_GetDaoTokenTreasury_Order {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_GetLiquidTreasury_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_GetLiquidTreasury_Order {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_GetTotalTreasury_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_GetTotalTreasury_Order {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_HistoricalBalances_OrderBy {
  Delta = 'delta',
  Timestamp = 'timestamp'
}

export enum QueryInput_HistoricalBalances_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_HistoricalDelegations_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_HistoricalVotingPowerByAccountId_OrderBy {
  Delta = 'delta',
  Timestamp = 'timestamp'
}

export enum QueryInput_HistoricalVotingPowerByAccountId_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_HistoricalVotingPower_OrderBy {
  Delta = 'delta',
  Timestamp = 'timestamp'
}

export enum QueryInput_HistoricalVotingPower_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_LastUpdate_Chart {
  AttackProfitability = 'attack_profitability',
  CostComparison = 'cost_comparison',
  TokenDistribution = 'token_distribution'
}

export enum QueryInput_ProposalNonVoters_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_ProposalsActivity_OrderBy {
  Timestamp = 'timestamp',
  VoteTiming = 'voteTiming',
  VotingPower = 'votingPower'
}

export enum QueryInput_ProposalsActivity_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

/** Filter proposals by vote type. Can be: 'yes' (For votes), 'no' (Against votes), 'abstain' (Abstain votes), 'no-vote' (Didn't vote) */
export enum QueryInput_ProposalsActivity_UserVoteFilter {
  Abstain = 'abstain',
  No = 'no',
  NoVote = 'no_vote',
  Yes = 'yes'
}

export enum QueryInput_Proposals_IncludeOptimisticProposals {
  False = 'FALSE',
  True = 'TRUE'
}

export enum QueryInput_Proposals_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_TokenMetrics_MetricType {
  CexSupply = 'CEX_SUPPLY',
  CirculatingSupply = 'CIRCULATING_SUPPLY',
  DelegatedSupply = 'DELEGATED_SUPPLY',
  DexSupply = 'DEX_SUPPLY',
  LendingSupply = 'LENDING_SUPPLY',
  TotalSupply = 'TOTAL_SUPPLY',
  Treasury = 'TREASURY'
}

export enum QueryInput_TokenMetrics_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_Token_Currency {
  Eth = 'eth',
  Usd = 'usd'
}

export enum QueryInput_Transactions_SortOrder {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_Transfers_SortBy {
  Amount = 'amount',
  Timestamp = 'timestamp'
}

export enum QueryInput_Transfers_SortOrder {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_VotesByProposalId_OrderBy {
  Timestamp = 'timestamp',
  VotingPower = 'votingPower'
}

export enum QueryInput_VotesByProposalId_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_Votes_OrderBy {
  Timestamp = 'timestamp',
  VotingPower = 'votingPower'
}

export enum QueryInput_Votes_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_VotingPowerVariations_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_VotingPowers_OrderBy {
  DelegationsCount = 'delegationsCount',
  VotingPower = 'votingPower',
  AbsoluteChange = 'absoluteChange',
  PercentageChange = 'percentageChange'
}

export enum QueryInput_VotingPowers_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type Query_AccountBalanceVariationsByAccountId_Data = {
  __typename?: 'query_accountBalanceVariationsByAccountId_data';
  absoluteChange: Scalars['String']['output'];
  accountId: Scalars['String']['output'];
  currentBalance: Scalars['String']['output'];
  percentageChange: Scalars['String']['output'];
  previousBalance: Scalars['String']['output'];
};

export type Query_AccountBalanceVariationsByAccountId_Period = {
  __typename?: 'query_accountBalanceVariationsByAccountId_period';
  endTimestamp: Scalars['String']['output'];
  startTimestamp: Scalars['String']['output'];
};

export type Query_AccountBalanceVariations_Items_Items = {
  __typename?: 'query_accountBalanceVariations_items_items';
  absoluteChange: Scalars['String']['output'];
  accountId: Scalars['String']['output'];
  currentBalance: Scalars['String']['output'];
  percentageChange: Scalars['String']['output'];
  previousBalance: Scalars['String']['output'];
};

export type Query_AccountBalanceVariations_Period = {
  __typename?: 'query_accountBalanceVariations_period';
  endTimestamp: Scalars['String']['output'];
  startTimestamp: Scalars['String']['output'];
};

export type Query_AccountBalances_Items_Items = {
  __typename?: 'query_accountBalances_items_items';
  address: Scalars['String']['output'];
  balance: Scalars['String']['output'];
  delegate: Scalars['String']['output'];
  tokenId: Scalars['String']['output'];
};

export type Query_AccountInteractions_Items_Items = {
  __typename?: 'query_accountInteractions_items_items';
  accountId: Scalars['String']['output'];
  amountTransferred: Scalars['String']['output'];
  totalVolume: Scalars['String']['output'];
  transferCount: Scalars['String']['output'];
};

export type Query_AccountInteractions_Period = {
  __typename?: 'query_accountInteractions_period';
  endTimestamp: Scalars['String']['output'];
  startTimestamp: Scalars['String']['output'];
};

export type Query_DelegationPercentageByDay_Items_Items = {
  __typename?: 'query_delegationPercentageByDay_items_items';
  date: Scalars['String']['output'];
  high: Scalars['String']['output'];
};

export type Query_DelegationPercentageByDay_PageInfo = {
  __typename?: 'query_delegationPercentageByDay_pageInfo';
  endDate?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  startDate?: Maybe<Scalars['String']['output']>;
};

export type Query_Delegations_Items_Items = {
  __typename?: 'query_delegations_items_items';
  amount: Scalars['String']['output'];
  delegateAddress: Scalars['String']['output'];
  delegatorAddress: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  transactionHash: Scalars['String']['output'];
};

export type Query_GetDaoTokenTreasury_Items_Items = {
  __typename?: 'query_getDaoTokenTreasury_items_items';
  /** Unix timestamp in milliseconds */
  date: Scalars['Float']['output'];
  /** Treasury value in USD */
  value: Scalars['Float']['output'];
};

export type Query_GetLiquidTreasury_Items_Items = {
  __typename?: 'query_getLiquidTreasury_items_items';
  /** Unix timestamp in milliseconds */
  date: Scalars['Float']['output'];
  /** Treasury value in USD */
  value: Scalars['Float']['output'];
};

export type Query_GetTotalTreasury_Items_Items = {
  __typename?: 'query_getTotalTreasury_items_items';
  /** Unix timestamp in milliseconds */
  date: Scalars['Float']['output'];
  /** Treasury value in USD */
  value: Scalars['Float']['output'];
};

export type Query_HistoricalBalances_Items_Items = {
  __typename?: 'query_historicalBalances_items_items';
  accountId: Scalars['String']['output'];
  balance: Scalars['String']['output'];
  daoId: Scalars['String']['output'];
  delta: Scalars['String']['output'];
  logIndex: Scalars['Float']['output'];
  timestamp: Scalars['String']['output'];
  transactionHash: Scalars['String']['output'];
  transfer: Query_HistoricalBalances_Items_Items_Transfer;
};

export type Query_HistoricalBalances_Items_Items_Transfer = {
  __typename?: 'query_historicalBalances_items_items_transfer';
  from: Scalars['String']['output'];
  to: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type Query_HistoricalDelegations_Items_Items = {
  __typename?: 'query_historicalDelegations_items_items';
  amount: Scalars['String']['output'];
  delegateAddress: Scalars['String']['output'];
  delegatorAddress: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  transactionHash: Scalars['String']['output'];
};

export type Query_HistoricalTokenData_Items = {
  __typename?: 'query_historicalTokenData_items';
  price: Scalars['String']['output'];
  timestamp: Scalars['Float']['output'];
};

export type Query_HistoricalVotingPowerByAccountId_Items_Items = {
  __typename?: 'query_historicalVotingPowerByAccountId_items_items';
  accountId: Scalars['String']['output'];
  daoId: Scalars['String']['output'];
  delegation?: Maybe<Query_HistoricalVotingPowerByAccountId_Items_Items_Delegation>;
  delta: Scalars['String']['output'];
  logIndex: Scalars['Float']['output'];
  timestamp: Scalars['String']['output'];
  transactionHash: Scalars['String']['output'];
  transfer?: Maybe<Query_HistoricalVotingPowerByAccountId_Items_Items_Transfer>;
  votingPower: Scalars['String']['output'];
};

export type Query_HistoricalVotingPowerByAccountId_Items_Items_Delegation = {
  __typename?: 'query_historicalVotingPowerByAccountId_items_items_delegation';
  from: Scalars['String']['output'];
  previousDelegate?: Maybe<Scalars['String']['output']>;
  to: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type Query_HistoricalVotingPowerByAccountId_Items_Items_Transfer = {
  __typename?: 'query_historicalVotingPowerByAccountId_items_items_transfer';
  from: Scalars['String']['output'];
  to: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type Query_HistoricalVotingPower_Items_Items = {
  __typename?: 'query_historicalVotingPower_items_items';
  accountId: Scalars['String']['output'];
  daoId: Scalars['String']['output'];
  delegation?: Maybe<Query_HistoricalVotingPower_Items_Items_Delegation>;
  delta: Scalars['String']['output'];
  logIndex: Scalars['Float']['output'];
  timestamp: Scalars['String']['output'];
  transactionHash: Scalars['String']['output'];
  transfer?: Maybe<Query_HistoricalVotingPower_Items_Items_Transfer>;
  votingPower: Scalars['String']['output'];
};

export type Query_HistoricalVotingPower_Items_Items_Delegation = {
  __typename?: 'query_historicalVotingPower_items_items_delegation';
  from: Scalars['String']['output'];
  previousDelegate?: Maybe<Scalars['String']['output']>;
  to: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type Query_HistoricalVotingPower_Items_Items_Transfer = {
  __typename?: 'query_historicalVotingPower_items_items_transfer';
  from: Scalars['String']['output'];
  to: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type Query_ProposalNonVoters_Items_Items = {
  __typename?: 'query_proposalNonVoters_items_items';
  lastVoteTimestamp: Scalars['Float']['output'];
  voter: Scalars['String']['output'];
  votingPower: Scalars['String']['output'];
  votingPowerVariation: Scalars['String']['output'];
};

export type Query_ProposalsActivity_Proposals_Items = {
  __typename?: 'query_proposalsActivity_proposals_items';
  proposal: Query_ProposalsActivity_Proposals_Items_Proposal;
  userVote?: Maybe<Query_ProposalsActivity_Proposals_Items_UserVote>;
};

export type Query_ProposalsActivity_Proposals_Items_Proposal = {
  __typename?: 'query_proposalsActivity_proposals_items_proposal';
  abstainVotes: Scalars['String']['output'];
  againstVotes: Scalars['String']['output'];
  daoId: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  endBlock: Scalars['Float']['output'];
  forVotes: Scalars['String']['output'];
  id: Scalars['String']['output'];
  proposerAccountId: Scalars['String']['output'];
  startBlock: Scalars['Float']['output'];
  status: Scalars['String']['output'];
  timestamp?: Maybe<Scalars['String']['output']>;
};

export type Query_ProposalsActivity_Proposals_Items_UserVote = {
  __typename?: 'query_proposalsActivity_proposals_items_userVote';
  id: Scalars['String']['output'];
  proposalId: Scalars['String']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  support?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['String']['output']>;
  voterAccountId: Scalars['String']['output'];
  votingPower: Scalars['String']['output'];
};

export type Query_Proposals_Items_Items = {
  __typename?: 'query_proposals_items_items';
  abstainVotes: Scalars['String']['output'];
  againstVotes: Scalars['String']['output'];
  calldatas: Array<Maybe<Scalars['String']['output']>>;
  daoId: Scalars['String']['output'];
  description: Scalars['String']['output'];
  endBlock: Scalars['Float']['output'];
  endTimestamp: Scalars['String']['output'];
  forVotes: Scalars['String']['output'];
  id: Scalars['String']['output'];
  proposalType?: Maybe<Scalars['Float']['output']>;
  proposerAccountId: Scalars['String']['output'];
  quorum: Scalars['String']['output'];
  startBlock: Scalars['Float']['output'];
  startTimestamp: Scalars['String']['output'];
  status: Scalars['String']['output'];
  targets: Array<Maybe<Scalars['String']['output']>>;
  timestamp: Scalars['String']['output'];
  title: Scalars['String']['output'];
  txHash: Scalars['String']['output'];
  values: Array<Maybe<Scalars['String']['output']>>;
};

export type Query_TokenMetrics_Items_Items = {
  __typename?: 'query_tokenMetrics_items_items';
  date: Scalars['String']['output'];
  high: Scalars['String']['output'];
  volume: Scalars['String']['output'];
};

export type Query_TokenMetrics_PageInfo = {
  __typename?: 'query_tokenMetrics_pageInfo';
  endDate?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  startDate?: Maybe<Scalars['String']['output']>;
};

export type Query_Transactions_Items_Items = {
  __typename?: 'query_transactions_items_items';
  delegations: Array<Maybe<Query_Transactions_Items_Items_Delegations_Items>>;
  from?: Maybe<Scalars['String']['output']>;
  isCex: Scalars['Boolean']['output'];
  isDex: Scalars['Boolean']['output'];
  isLending: Scalars['Boolean']['output'];
  isTotal: Scalars['Boolean']['output'];
  timestamp: Scalars['String']['output'];
  to?: Maybe<Scalars['String']['output']>;
  transactionHash: Scalars['String']['output'];
  transfers: Array<Maybe<Query_Transactions_Items_Items_Transfers_Items>>;
};

export type Query_Transactions_Items_Items_Delegations_Items = {
  __typename?: 'query_transactions_items_items_delegations_items';
  daoId: Scalars['String']['output'];
  delegateAccountId: Scalars['String']['output'];
  delegatedValue: Scalars['String']['output'];
  delegatorAccountId: Scalars['String']['output'];
  isCex: Scalars['Boolean']['output'];
  isDex: Scalars['Boolean']['output'];
  isLending: Scalars['Boolean']['output'];
  isTotal: Scalars['Boolean']['output'];
  logIndex: Scalars['Float']['output'];
  previousDelegate?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['String']['output'];
  transactionHash: Scalars['String']['output'];
};

export type Query_Transactions_Items_Items_Transfers_Items = {
  __typename?: 'query_transactions_items_items_transfers_items';
  amount: Scalars['String']['output'];
  daoId: Scalars['String']['output'];
  fromAccountId: Scalars['String']['output'];
  isCex: Scalars['Boolean']['output'];
  isDex: Scalars['Boolean']['output'];
  isLending: Scalars['Boolean']['output'];
  isTotal: Scalars['Boolean']['output'];
  logIndex: Scalars['Float']['output'];
  timestamp: Scalars['String']['output'];
  toAccountId: Scalars['String']['output'];
  tokenId: Scalars['String']['output'];
  transactionHash: Scalars['String']['output'];
};

export type Query_Transfers_Items_Items = {
  __typename?: 'query_transfers_items_items';
  amount: Scalars['String']['output'];
  daoId: Scalars['String']['output'];
  fromAccountId: Scalars['String']['output'];
  isCex: Scalars['Boolean']['output'];
  isDex: Scalars['Boolean']['output'];
  isLending: Scalars['Boolean']['output'];
  isTotal: Scalars['Boolean']['output'];
  logIndex: Scalars['Float']['output'];
  timestamp: Scalars['String']['output'];
  toAccountId: Scalars['String']['output'];
  tokenId: Scalars['String']['output'];
  transactionHash: Scalars['String']['output'];
};

export type Query_VotesByProposalId_Items_Items = {
  __typename?: 'query_votesByProposalId_items_items';
  proposalId: Scalars['String']['output'];
  proposalTitle: Scalars['String']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  support: Scalars['Float']['output'];
  timestamp: Scalars['Float']['output'];
  transactionHash: Scalars['String']['output'];
  voterAddress: Scalars['String']['output'];
  votingPower: Scalars['String']['output'];
};

export type Query_Votes_Items_Items = {
  __typename?: 'query_votes_items_items';
  proposalId: Scalars['String']['output'];
  proposalTitle: Scalars['String']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  support: Scalars['Float']['output'];
  timestamp: Scalars['Float']['output'];
  transactionHash: Scalars['String']['output'];
  voterAddress: Scalars['String']['output'];
  votingPower: Scalars['String']['output'];
};

export type Query_VotingPowerVariationsByAccountId_Data = {
  __typename?: 'query_votingPowerVariationsByAccountId_data';
  absoluteChange: Scalars['String']['output'];
  accountId: Scalars['String']['output'];
  currentVotingPower: Scalars['String']['output'];
  percentageChange: Scalars['String']['output'];
  previousVotingPower: Scalars['String']['output'];
};

export type Query_VotingPowerVariationsByAccountId_Period = {
  __typename?: 'query_votingPowerVariationsByAccountId_period';
  endTimestamp: Scalars['String']['output'];
  startTimestamp: Scalars['String']['output'];
};

export type Query_VotingPowerVariations_Items_Items = {
  __typename?: 'query_votingPowerVariations_items_items';
  absoluteChange: Scalars['String']['output'];
  accountId: Scalars['String']['output'];
  currentVotingPower: Scalars['String']['output'];
  percentageChange: Scalars['String']['output'];
  previousVotingPower: Scalars['String']['output'];
};

export type Query_VotingPowerVariations_Period = {
  __typename?: 'query_votingPowerVariations_period';
  endTimestamp: Scalars['String']['output'];
  startTimestamp: Scalars['String']['output'];
};

export type Query_VotingPowers_Items_Items = {
  __typename?: 'query_votingPowers_items_items';
  accountId: Scalars['String']['output'];
  delegationsCount: Scalars['Float']['output'];
  proposalsCount: Scalars['Float']['output'];
  votesCount: Scalars['Float']['output'];
  votingPower: Scalars['String']['output'];
};

export enum Timestamp_Const {
  Timestamp = 'timestamp'
}

export type TokenMetrics_200_Response = {
  __typename?: 'tokenMetrics_200_response';
  items: Array<Maybe<Query_TokenMetrics_Items_Items>>;
  pageInfo: Query_TokenMetrics_PageInfo;
};

export type Token_200_Response = {
  __typename?: 'token_200_response';
  cexSupply: Scalars['String']['output'];
  circulatingSupply: Scalars['String']['output'];
  decimals: Scalars['Float']['output'];
  delegatedSupply: Scalars['String']['output'];
  dexSupply: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lendingSupply: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  price: Scalars['String']['output'];
  totalSupply: Scalars['String']['output'];
  treasury: Scalars['String']['output'];
};

export type Transactions_200_Response = {
  __typename?: 'transactions_200_response';
  items: Array<Maybe<Query_Transactions_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export type Transfers_200_Response = {
  __typename?: 'transfers_200_response';
  items: Array<Maybe<Query_Transfers_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export type VotesByProposalId_200_Response = {
  __typename?: 'votesByProposalId_200_response';
  items: Array<Maybe<Query_VotesByProposalId_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export type Votes_200_Response = {
  __typename?: 'votes_200_response';
  items: Array<Maybe<Query_Votes_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export type VotingPowerByAccountId_200_Response = {
  __typename?: 'votingPowerByAccountId_200_response';
  accountId: Scalars['String']['output'];
  delegationsCount: Scalars['Float']['output'];
  proposalsCount: Scalars['Float']['output'];
  votesCount: Scalars['Float']['output'];
  votingPower: Scalars['String']['output'];
};

export type VotingPowerVariationsByAccountId_200_Response = {
  __typename?: 'votingPowerVariationsByAccountId_200_response';
  data: Query_VotingPowerVariationsByAccountId_Data;
  period: Query_VotingPowerVariationsByAccountId_Period;
};

export type VotingPowerVariations_200_Response = {
  __typename?: 'votingPowerVariations_200_response';
  items: Array<Maybe<Query_VotingPowerVariations_Items_Items>>;
  period: Query_VotingPowerVariations_Period;
};

export type VotingPowers_200_Response = {
  __typename?: 'votingPowers_200_response';
  items: Array<Maybe<Query_VotingPowers_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export type BalanceHistoryQueryVariables = Exact<{
  address: Scalars['String']['input'];
  offset?: InputMaybe<Scalars['Float']['input']>;
  limit?: InputMaybe<Scalars['Float']['input']>;
  sortBy?: InputMaybe<QueryInput_Transfers_SortBy>;
  sortOrder?: InputMaybe<QueryInput_Transfers_SortOrder>;
  from?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
  fromDate?: InputMaybe<Scalars['Float']['input']>;
  toDate?: InputMaybe<Scalars['Float']['input']>;
}>;


export type BalanceHistoryQuery = { __typename?: 'Query', transfers?: { __typename?: 'transfers_200_response', totalCount: number, items: Array<{ __typename?: 'query_transfers_items_items', timestamp: string, amount: string, fromAccountId: string, toAccountId: string, transactionHash: string } | null> } | null };

export type BalanceHistoryGraphQueryVariables = Exact<{
  address: Scalars['String']['input'];
  orderBy?: InputMaybe<QueryInput_HistoricalBalances_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_HistoricalBalances_OrderDirection>;
  fromDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type BalanceHistoryGraphQuery = { __typename?: 'Query', historicalBalances?: { __typename?: 'historicalBalances_200_response', items: Array<{ __typename?: 'query_historicalBalances_items_items', balance: string, logIndex: number, timestamp: string, transactionHash: string, transfer: { __typename?: 'query_historicalBalances_items_items_transfer', from: string, to: string, value: string } } | null> } | null };

export type BalanceVariationsQueryVariables = Exact<{
  addresses: Scalars['JSON']['input'];
  fromDate: Scalars['String']['input'];
}>;


export type BalanceVariationsQuery = { __typename?: 'Query', accountBalanceVariations?: { __typename?: 'accountBalanceVariations_200_response', items: Array<{ __typename?: 'query_accountBalanceVariations_items_items', accountId: string, previousBalance: string, currentBalance: string, absoluteChange: string, percentageChange: string } | null> } | null };

export type AccountBalanceVariationsQueryVariables = Exact<{
  fromDate: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
}>;


export type AccountBalanceVariationsQuery = { __typename?: 'Query', accountBalanceVariations?: { __typename?: 'accountBalanceVariations_200_response', items: Array<{ __typename?: 'query_accountBalanceVariations_items_items', accountId: string, previousBalance: string, currentBalance: string, absoluteChange: string, percentageChange: string } | null> } | null };

export type CompareTreasuryQueryVariables = Exact<{
  days: QueryInput_CompareTreasury_Days;
}>;


export type CompareTreasuryQuery = { __typename?: 'Query', compareTreasury?: { __typename?: 'compareTreasury_200_response', changeRate: number, currentTreasury: string, oldTreasury: string } | null };

export type TopVotingPowerVariationsQueryVariables = Exact<{
  fromDate: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
}>;


export type TopVotingPowerVariationsQuery = { __typename?: 'Query', votingPowerVariations?: { __typename?: 'votingPowerVariations_200_response', items: Array<{ __typename?: 'query_votingPowerVariations_items_items', absoluteChange: string, accountId: string, currentVotingPower: string, percentageChange: string, previousVotingPower: string } | null> } | null };

export type GetDaoDataQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDaoDataQuery = { __typename?: 'Query', dao?: { __typename?: 'dao_200_response', id: string, chainId: number, quorum: string, proposalThreshold: string, votingDelay: string, votingPeriod: string, timelockDelay: string } | null };

export type GetDelegatesQueryVariables = Exact<{
  addresses?: InputMaybe<Scalars['JSON']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  orderDirection?: InputMaybe<QueryInput_VotingPowers_OrderDirection>;
  orderBy?: InputMaybe<QueryInput_VotingPowers_OrderBy>;
}>;


export type GetDelegatesQuery = { __typename?: 'Query', votingPowers?: { __typename?: 'votingPowers_200_response', totalCount: number, items: Array<{ __typename?: 'query_votingPowers_items_items', accountId: string, delegationsCount: number, votingPower: string } | null> } | null };

export type GetDelegatorVotingPowerDetailsQueryVariables = Exact<{
  addresses?: InputMaybe<Scalars['JSON']['input']>;
  address: Scalars['String']['input'];
  orderDirection?: InputMaybe<QueryInput_AccountBalances_OrderDirection>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
}>;


export type GetDelegatorVotingPowerDetailsQuery = { __typename?: 'Query', votingPowerByAccountId?: { __typename?: 'votingPowerByAccountId_200_response', accountId: string, votingPower: string } | null, accountBalances?: { __typename?: 'accountBalances_200_response', totalCount: number, items: Array<{ __typename?: 'query_accountBalances_items_items', address: string, balance: string } | null> } | null };

export type GetDelegationsTimestampQueryVariables = Exact<{
  delegate: Scalars['String']['input'];
}>;


export type GetDelegationsTimestampQuery = { __typename?: 'Query', delegations?: { __typename?: 'delegations_200_response', totalCount: number, items: Array<{ __typename?: 'query_delegations_items_items', delegatorAddress: string, delegateAddress: string, timestamp: string } | null> } | null };

export type GetTopFiveDelegatorsQueryVariables = Exact<{
  delegates?: InputMaybe<Scalars['JSON']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
}>;


export type GetTopFiveDelegatorsQuery = { __typename?: 'Query', accountBalances?: { __typename?: 'accountBalances_200_response', items: Array<{ __typename?: 'query_accountBalances_items_items', address: string, balance: string } | null> } | null };

export type GetVotingPowerCountingQueryVariables = Exact<{
  delegates?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type GetVotingPowerCountingQuery = { __typename?: 'Query', accountBalances?: { __typename?: 'accountBalances_200_response', totalCount: number } | null };

export type GetDelegateDelegationHistoryGraphQueryVariables = Exact<{
  accountId: Scalars['String']['input'];
  fromTimestamp?: InputMaybe<Scalars['String']['input']>;
  toTimestamp?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<QueryInput_HistoricalVotingPowerByAccountId_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_HistoricalVotingPowerByAccountId_OrderDirection>;
}>;


export type GetDelegateDelegationHistoryGraphQuery = { __typename?: 'Query', historicalVotingPowerByAccountId?: { __typename?: 'historicalVotingPowerByAccountId_200_response', totalCount: number, items: Array<{ __typename?: 'query_historicalVotingPowerByAccountId_items_items', delta: string, transactionHash: string, timestamp: string, votingPower: string, delegation?: { __typename?: 'query_historicalVotingPowerByAccountId_items_items_delegation', from: string, previousDelegate?: string | null, to: string, value: string } | null, transfer?: { __typename?: 'query_historicalVotingPowerByAccountId_items_items_transfer', from: string, to: string, value: string } | null } | null> } | null };

export type GetDelegatedSupplyHistoryQueryVariables = Exact<{
  startDate: Scalars['String']['input'];
  endDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetDelegatedSupplyHistoryQuery = { __typename?: 'Query', averageDelegationPercentageByDay: { __typename?: 'AverageDelegationPercentagePage', items: Array<{ __typename?: 'AverageDelegationPercentageItem', date: string, high: string }> } };

export type GetHistoricalVotingAndActivityQueryVariables = Exact<{
  addresses: Scalars['JSON']['input'];
  address: Scalars['String']['input'];
  fromDate: Scalars['String']['input'];
  toDate: Scalars['String']['input'];
}>;


export type GetHistoricalVotingAndActivityQuery = { __typename?: 'Query', votingPowerVariations?: { __typename?: 'votingPowerVariations_200_response', items: Array<{ __typename?: 'query_votingPowerVariations_items_items', accountId: string, previousVotingPower: string, currentVotingPower: string, percentageChange: string, absoluteChange: string } | null> } | null, proposalsActivity?: { __typename?: 'proposalsActivity_200_response', totalProposals: number, votedProposals: number, neverVoted: boolean, avgTimeBeforeEnd: number } | null };

export type GetDelegateProposalsActivityQueryVariables = Exact<{
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetDelegateProposalsActivityQuery = { __typename?: 'Query', proposalsActivity?: { __typename?: 'proposalsActivity_200_response', address: string, totalProposals: number, votedProposals: number, neverVoted: boolean, avgTimeBeforeEnd: number } | null };

export type GetProposalsFromDaoQueryVariables = Exact<{
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderDirection?: InputMaybe<QueryInput_Proposals_OrderDirection>;
  status?: InputMaybe<Scalars['JSON']['input']>;
  fromDate?: InputMaybe<Scalars['Float']['input']>;
}>;


export type GetProposalsFromDaoQuery = { __typename?: 'Query', proposals?: { __typename?: 'proposals_200_response', totalCount: number, items: Array<{ __typename?: 'query_proposals_items_items', id: string, daoId: string, txHash: string, quorum: string, forVotes: string, againstVotes: string, abstainVotes: string, timestamp: string, status: string, proposerAccountId: string, title: string, startTimestamp: string, endTimestamp: string, targets: Array<string | null>, values: Array<string | null> } | null> } | null };

export type GetProposalQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetProposalQuery = { __typename?: 'Query', proposal?: { __typename?: 'proposal_200_response', id: string, daoId: string, txHash: string, proposerAccountId: string, title: string, description: string, quorum: string, timestamp: string, status: string, forVotes: string, againstVotes: string, abstainVotes: string, startTimestamp: string, endTimestamp: string, calldatas: Array<string | null>, targets: Array<string | null>, values: Array<string | null> } | null };

export type GetVotesQueryVariables = Exact<{
  proposalId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  orderBy?: InputMaybe<QueryInput_VotesByProposalId_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_VotesByProposalId_OrderDirection>;
}>;


export type GetVotesQuery = { __typename?: 'Query', votesByProposalId?: { __typename?: 'votesByProposalId_200_response', totalCount: number, items: Array<{ __typename?: 'query_votesByProposalId_items_items', voterAddress: string, transactionHash: string, proposalId: string, support: number, votingPower: string, reason?: string | null, timestamp: number } | null> } | null };

export type GetVotingPowerChangeQueryVariables = Exact<{
  addresses: Scalars['JSON']['input'];
  fromDate: Scalars['String']['input'];
  toDate: Scalars['String']['input'];
}>;


export type GetVotingPowerChangeQuery = { __typename?: 'Query', votingPowerVariations?: { __typename?: 'votingPowerVariations_200_response', items: Array<{ __typename?: 'query_votingPowerVariations_items_items', accountId: string, previousVotingPower: string, currentVotingPower: string, absoluteChange: string, percentageChange: string } | null> } | null };

export type GetProposalNonVotersQueryVariables = Exact<{
  id: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  orderDirection?: InputMaybe<QueryInput_ProposalNonVoters_OrderDirection>;
}>;


export type GetProposalNonVotersQuery = { __typename?: 'Query', proposalNonVoters?: { __typename?: 'proposalNonVoters_200_response', totalCount: number, items: Array<{ __typename?: 'query_proposalNonVoters_items_items', lastVoteTimestamp: number, voter: string, votingPower: string, votingPowerVariation: string } | null> } | null };

export type GetAccountPowerQueryVariables = Exact<{
  address: Scalars['String']['input'];
  addresses: Scalars['JSON']['input'];
  proposalId: Scalars['String']['input'];
}>;


export type GetAccountPowerQuery = { __typename?: 'Query', votingPowerByAccountId?: { __typename?: 'votingPowerByAccountId_200_response', accountId: string, votingPower: string } | null, votesByProposalId?: { __typename?: 'votesByProposalId_200_response', totalCount: number, items: Array<{ __typename?: 'query_votesByProposalId_items_items', support: number, votingPower: string, reason?: string | null, timestamp: number, transactionHash: string } | null> } | null };

export type HistoricalVotingPowerQueryVariables = Exact<{
  address?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<QueryInput_HistoricalVotingPower_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_HistoricalVotingPower_OrderDirection>;
  toValue?: InputMaybe<Scalars['String']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  fromDate?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type HistoricalVotingPowerQuery = { __typename?: 'Query', historicalVotingPower?: { __typename?: 'historicalVotingPower_200_response', totalCount: number, items: Array<{ __typename?: 'query_historicalVotingPower_items_items', accountId: string, votingPower: string, transactionHash: string, timestamp: string, logIndex: number, delta: string, transfer?: { __typename?: 'query_historicalVotingPower_items_items_transfer', value: string, to: string, from: string } | null, delegation?: { __typename?: 'query_historicalVotingPower_items_items_delegation', from: string, to: string, value: string } | null } | null> } | null };

export type HistoricalVotingPowerByAccountQueryVariables = Exact<{
  account: Scalars['String']['input'];
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<QueryInput_HistoricalVotingPowerByAccountId_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_HistoricalVotingPowerByAccountId_OrderDirection>;
  toValue?: InputMaybe<Scalars['String']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  fromDate?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type HistoricalVotingPowerByAccountQuery = { __typename?: 'Query', historicalVotingPowerByAccountId?: { __typename?: 'historicalVotingPowerByAccountId_200_response', totalCount: number, items: Array<{ __typename?: 'query_historicalVotingPowerByAccountId_items_items', accountId: string, votingPower: string, transactionHash: string, timestamp: string, logIndex: number, delta: string, transfer?: { __typename?: 'query_historicalVotingPowerByAccountId_items_items_transfer', value: string, to: string, from: string } | null, delegation?: { __typename?: 'query_historicalVotingPowerByAccountId_items_items_delegation', from: string, to: string, value: string } | null } | null> } | null };

export type GetProposalsActivityQueryVariables = Exact<{
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<QueryInput_ProposalsActivity_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_ProposalsActivity_OrderDirection>;
  userVoteFilter?: InputMaybe<QueryInput_ProposalsActivity_UserVoteFilter>;
}>;


export type GetProposalsActivityQuery = { __typename?: 'Query', proposalsActivity?: { __typename?: 'proposalsActivity_200_response', totalProposals: number, votedProposals: number, neverVoted: boolean, winRate: number, yesRate: number, avgTimeBeforeEnd: number, proposals: Array<{ __typename?: 'query_proposalsActivity_proposals_items', proposal: { __typename?: 'query_proposalsActivity_proposals_items_proposal', id: string, description?: string | null, startBlock: number, endBlock: number, status: string, againstVotes: string, forVotes: string, abstainVotes: string, timestamp?: string | null, proposerAccountId: string, daoId: string }, userVote?: { __typename?: 'query_proposalsActivity_proposals_items_userVote', id: string, support?: string | null, votingPower: string, reason?: string | null, timestamp?: string | null, proposalId: string, voterAccountId: string } | null } | null> } | null };

export type GetProposalsQueryVariables = Exact<{
  fromDate?: InputMaybe<Scalars['Float']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
}>;


export type GetProposalsQuery = { __typename?: 'Query', proposals?: { __typename?: 'proposals_200_response', items: Array<{ __typename?: 'query_proposals_items_items', id: string, title: string, timestamp: string } | null> } | null };

export type GetDaoAddressesAccountBalancesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDaoAddressesAccountBalancesQuery = { __typename?: 'Query', accountBalances?: { __typename?: 'accountBalances_200_response', items: Array<{ __typename?: 'query_accountBalances_items_items', address: string, balance: string } | null> } | null };

export type GetAccountInteractionsQueryVariables = Exact<{
  address: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  maxAmount?: InputMaybe<Scalars['String']['input']>;
  minAmount?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<QueryInput_AccountInteractions_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_AccountInteractions_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  filterAddress?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAccountInteractionsQuery = { __typename?: 'Query', accountInteractions?: { __typename?: 'accountInteractions_200_response', totalCount: number, items: Array<{ __typename?: 'query_accountInteractions_items_items', accountId: string, amountTransferred: string, totalVolume: string, transferCount: string } | null> } | null };

export type GetDelegationHistoryItemsQueryVariables = Exact<{
  delegator: Scalars['String']['input'];
  delegate?: InputMaybe<Scalars['JSON']['input']>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<QueryInput_HistoricalDelegations_OrderDirection>;
}>;


export type GetDelegationHistoryItemsQuery = { __typename?: 'Query', historicalDelegations?: { __typename?: 'historicalDelegations_200_response', totalCount: number, items: Array<{ __typename?: 'query_historicalDelegations_items_items', delegatorAddress: string, delegateAddress: string, amount: string, timestamp: string, transactionHash: string } | null> } | null };

export type GetTopTokenHoldersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  orderDirection?: InputMaybe<QueryInput_AccountBalances_OrderDirection>;
  addresses?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type GetTopTokenHoldersQuery = { __typename?: 'Query', accountBalances?: { __typename?: 'accountBalances_200_response', totalCount: number, items: Array<{ __typename?: 'query_accountBalances_items_items', address: string, balance: string, delegate: string, tokenId: string } | null> } | null };

export type TokenInfoQueryVariables = Exact<{
  currency?: InputMaybe<QueryInput_Token_Currency>;
}>;


export type TokenInfoQuery = { __typename?: 'Query', token?: { __typename?: 'token_200_response', circulatingSupply: string, delegatedSupply: string, lendingSupply: string, name?: string | null, treasury: string } | null };

export type TransactionsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  from?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
  minAmount?: InputMaybe<Scalars['String']['input']>;
  maxAmount?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<QueryInput_Transactions_SortOrder>;
  affectedSupply?: InputMaybe<Scalars['JSON']['input']>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  includes?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type TransactionsQuery = { __typename?: 'Query', transactions?: { __typename?: 'transactions_200_response', totalCount: number, items: Array<{ __typename?: 'query_transactions_items_items', from?: string | null, isCex: boolean, isDex: boolean, isLending: boolean, isTotal: boolean, timestamp: string, to?: string | null, transactionHash: string, delegations: Array<{ __typename?: 'query_transactions_items_items_delegations_items', daoId: string, delegateAccountId: string, delegatedValue: string, delegatorAccountId: string, isCex: boolean, isDex: boolean, isTotal: boolean, isLending: boolean, logIndex: number, previousDelegate?: string | null, timestamp: string, transactionHash: string } | null>, transfers: Array<{ __typename?: 'query_transactions_items_items_transfers_items', amount: string, daoId: string, fromAccountId: string, isCex: boolean, isDex: boolean, isLending: boolean, isTotal: boolean, logIndex: number, timestamp: string, toAccountId: string, tokenId: string, transactionHash: string } | null> } | null> } | null };
