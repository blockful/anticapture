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
  BigInt: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
  /** Integers that will have a value of 0 or more. */
  NonNegativeInt: { input: any; output: any; }
  ObjMap: { input: any; output: any; }
  /** Integers that will have a value greater than 0. */
  PositiveInt: { input: any; output: any; }
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

export type Meta = {
  __typename?: 'Meta';
  status?: Maybe<Scalars['JSON']['output']>;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  _meta?: Maybe<Meta>;
  account?: Maybe<Account>;
  accountBalance?: Maybe<AccountBalance>;
  accountBalances: AccountBalancePage;
  accountPower?: Maybe<AccountPower>;
  accountPowers: AccountPowerPage;
  accounts: AccountPage;
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
  dao?: Maybe<Dao>;
  daoMetricsDayBucket?: Maybe<DaoMetricsDayBucket>;
  daoMetricsDayBuckets: DaoMetricsDayBucketPage;
  daos: DaoPage;
  delegation?: Maybe<Delegation>;
  delegations: DelegationPage;
  /** Fetch historical token balances for multiple addresses at a specific time period using multicall */
  historicalBalances?: Maybe<Array<Maybe<Query_HistoricalBalances_Items>>>;
  /** Get historical market data for a specific token */
  historicalTokenData?: Maybe<HistoricalTokenData_200_Response>;
  /** Fetch historical voting power for multiple addresses at a specific time period using multicall */
  historicalVotingPower?: Maybe<Array<Maybe<Query_HistoricalVotingPower_Items>>>;
  /** Returns proposal activity data including voting history, win rates, and detailed proposal information for the specified delegate within the given time window */
  proposalsActivity?: Maybe<ProposalsActivity_200_Response>;
  proposalsOnchain?: Maybe<ProposalsOnchain>;
  proposalsOnchains: ProposalsOnchainPage;
  token?: Maybe<Token>;
  tokens: TokenPage;
  /** Get total assets */
  totalAssets?: Maybe<Array<Maybe<Query_TotalAssets_Items>>>;
  transfer?: Maybe<Transfer>;
  transfers: TransferPage;
  votesOnchain?: Maybe<VotesOnchain>;
  votesOnchains: VotesOnchainPage;
  votingPowerHistory?: Maybe<VotingPowerHistory>;
  votingPowerHistorys: VotingPowerHistoryPage;
};


export type QueryAccountArgs = {
  id: Scalars['String']['input'];
};


export type QueryAccountBalanceArgs = {
  accountId: Scalars['String']['input'];
  tokenId: Scalars['String']['input'];
};


export type QueryAccountBalancesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AccountBalanceFilter>;
};


export type QueryAccountPowerArgs = {
  accountId: Scalars['String']['input'];
};


export type QueryAccountPowersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AccountPowerFilter>;
};


export type QueryAccountsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AccountFilter>;
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


export type QueryDaoArgs = {
  id: Scalars['String']['input'];
};


export type QueryDaoMetricsDayBucketArgs = {
  date: Scalars['BigInt']['input'];
  metricType: Scalars['String']['input'];
  tokenId: Scalars['String']['input'];
};


export type QueryDaoMetricsDayBucketsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<DaoMetricsDayBucketFilter>;
};


export type QueryDaosArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<DaoFilter>;
};


export type QueryDelegationArgs = {
  transactionHash: Scalars['String']['input'];
};


export type QueryDelegationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<DelegationFilter>;
};


export type QueryHistoricalBalancesArgs = {
  addresses: Scalars['JSON']['input'];
  days?: InputMaybe<QueryInput_HistoricalBalances_Days>;
};


export type QueryHistoricalVotingPowerArgs = {
  addresses: Scalars['JSON']['input'];
  days?: InputMaybe<QueryInput_HistoricalVotingPower_Days>;
};


export type QueryProposalsActivityArgs = {
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<QueryInput_ProposalsActivity_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_ProposalsActivity_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  userVoteFilter?: InputMaybe<QueryInput_ProposalsActivity_UserVoteFilter>;
};


export type QueryProposalsOnchainArgs = {
  id: Scalars['String']['input'];
};


export type QueryProposalsOnchainsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<ProposalsOnchainFilter>;
};


export type QueryTokenArgs = {
  id: Scalars['String']['input'];
};


export type QueryTokensArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<TokenFilter>;
};


export type QueryTotalAssetsArgs = {
  days?: InputMaybe<QueryInput_TotalAssets_Days>;
};


export type QueryTransferArgs = {
  transactionHash: Scalars['String']['input'];
};


export type QueryTransfersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<TransferFilter>;
};


export type QueryVotesOnchainArgs = {
  proposalId: Scalars['String']['input'];
  voterAccountId: Scalars['String']['input'];
};


export type QueryVotesOnchainsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<VotesOnchainFilter>;
};


export type QueryVotingPowerHistoryArgs = {
  accountId: Scalars['String']['input'];
  transactionHash: Scalars['String']['input'];
};


export type QueryVotingPowerHistorysArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<VotingPowerHistoryFilter>;
};

export type Account = {
  __typename?: 'account';
  balances?: Maybe<AccountBalancePage>;
  delegatedFromBalances?: Maybe<AccountBalancePage>;
  delegationsFrom?: Maybe<DelegationPage>;
  delegationsTo?: Maybe<DelegationPage>;
  id: Scalars['String']['output'];
  powers?: Maybe<AccountPowerPage>;
  proposals?: Maybe<ProposalsOnchainPage>;
  receivedTransfers?: Maybe<TransferPage>;
  sentTransfers?: Maybe<TransferPage>;
  votes?: Maybe<VotesOnchainPage>;
};


export type AccountBalancesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AccountBalanceFilter>;
};


export type AccountDelegatedFromBalancesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AccountBalanceFilter>;
};


export type AccountDelegationsFromArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<DelegationFilter>;
};


export type AccountDelegationsToArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<DelegationFilter>;
};


export type AccountPowersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AccountPowerFilter>;
};


export type AccountProposalsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<ProposalsOnchainFilter>;
};


export type AccountReceivedTransfersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<TransferFilter>;
};


export type AccountSentTransfersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<TransferFilter>;
};


export type AccountVotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<VotesOnchainFilter>;
};

export type AccountBalance = {
  __typename?: 'accountBalance';
  account?: Maybe<Account>;
  accountId: Scalars['String']['output'];
  balance: Scalars['BigInt']['output'];
  delegate: Scalars['String']['output'];
  delegateAccount?: Maybe<Account>;
  delegatePower?: Maybe<AccountPower>;
  delegatedTo?: Maybe<AccountPower>;
  token?: Maybe<Token>;
  tokenId: Scalars['String']['output'];
};

export type AccountBalanceFilter = {
  AND?: InputMaybe<Array<InputMaybe<AccountBalanceFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<AccountBalanceFilter>>>;
  accountId?: InputMaybe<Scalars['String']['input']>;
  accountId_contains?: InputMaybe<Scalars['String']['input']>;
  accountId_ends_with?: InputMaybe<Scalars['String']['input']>;
  accountId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  accountId_not?: InputMaybe<Scalars['String']['input']>;
  accountId_not_contains?: InputMaybe<Scalars['String']['input']>;
  accountId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  accountId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  accountId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  accountId_starts_with?: InputMaybe<Scalars['String']['input']>;
  balance?: InputMaybe<Scalars['BigInt']['input']>;
  balance_gt?: InputMaybe<Scalars['BigInt']['input']>;
  balance_gte?: InputMaybe<Scalars['BigInt']['input']>;
  balance_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  balance_lt?: InputMaybe<Scalars['BigInt']['input']>;
  balance_lte?: InputMaybe<Scalars['BigInt']['input']>;
  balance_not?: InputMaybe<Scalars['BigInt']['input']>;
  balance_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  delegate?: InputMaybe<Scalars['String']['input']>;
  delegate_contains?: InputMaybe<Scalars['String']['input']>;
  delegate_ends_with?: InputMaybe<Scalars['String']['input']>;
  delegate_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  delegate_not?: InputMaybe<Scalars['String']['input']>;
  delegate_not_contains?: InputMaybe<Scalars['String']['input']>;
  delegate_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  delegate_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  delegate_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  delegate_starts_with?: InputMaybe<Scalars['String']['input']>;
  tokenId?: InputMaybe<Scalars['String']['input']>;
  tokenId_contains?: InputMaybe<Scalars['String']['input']>;
  tokenId_ends_with?: InputMaybe<Scalars['String']['input']>;
  tokenId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tokenId_not?: InputMaybe<Scalars['String']['input']>;
  tokenId_not_contains?: InputMaybe<Scalars['String']['input']>;
  tokenId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  tokenId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tokenId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  tokenId_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type AccountBalancePage = {
  __typename?: 'accountBalancePage';
  items: Array<AccountBalance>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AccountFilter = {
  AND?: InputMaybe<Array<InputMaybe<AccountFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<AccountFilter>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type AccountPage = {
  __typename?: 'accountPage';
  items: Array<Account>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AccountPower = {
  __typename?: 'accountPower';
  account?: Maybe<Account>;
  accountId: Scalars['String']['output'];
  daoId: Scalars['String']['output'];
  delegationsCount: Scalars['Int']['output'];
  firstVoteTimestamp?: Maybe<Scalars['BigInt']['output']>;
  lastVoteTimestamp: Scalars['BigInt']['output'];
  proposalsCount: Scalars['Int']['output'];
  votesCount: Scalars['Int']['output'];
  votingPower: Scalars['BigInt']['output'];
};

export type AccountPowerFilter = {
  AND?: InputMaybe<Array<InputMaybe<AccountPowerFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<AccountPowerFilter>>>;
  accountId?: InputMaybe<Scalars['String']['input']>;
  accountId_contains?: InputMaybe<Scalars['String']['input']>;
  accountId_ends_with?: InputMaybe<Scalars['String']['input']>;
  accountId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  accountId_not?: InputMaybe<Scalars['String']['input']>;
  accountId_not_contains?: InputMaybe<Scalars['String']['input']>;
  accountId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  accountId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  accountId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  accountId_starts_with?: InputMaybe<Scalars['String']['input']>;
  daoId?: InputMaybe<Scalars['String']['input']>;
  daoId_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not?: InputMaybe<Scalars['String']['input']>;
  daoId_not_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  daoId_starts_with?: InputMaybe<Scalars['String']['input']>;
  delegationsCount?: InputMaybe<Scalars['Int']['input']>;
  delegationsCount_gt?: InputMaybe<Scalars['Int']['input']>;
  delegationsCount_gte?: InputMaybe<Scalars['Int']['input']>;
  delegationsCount_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  delegationsCount_lt?: InputMaybe<Scalars['Int']['input']>;
  delegationsCount_lte?: InputMaybe<Scalars['Int']['input']>;
  delegationsCount_not?: InputMaybe<Scalars['Int']['input']>;
  delegationsCount_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  firstVoteTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  firstVoteTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  firstVoteTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  firstVoteTimestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  firstVoteTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  firstVoteTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  firstVoteTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  firstVoteTimestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  lastVoteTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  lastVoteTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lastVoteTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lastVoteTimestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  lastVoteTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lastVoteTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lastVoteTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  lastVoteTimestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  proposalsCount?: InputMaybe<Scalars['Int']['input']>;
  proposalsCount_gt?: InputMaybe<Scalars['Int']['input']>;
  proposalsCount_gte?: InputMaybe<Scalars['Int']['input']>;
  proposalsCount_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  proposalsCount_lt?: InputMaybe<Scalars['Int']['input']>;
  proposalsCount_lte?: InputMaybe<Scalars['Int']['input']>;
  proposalsCount_not?: InputMaybe<Scalars['Int']['input']>;
  proposalsCount_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  votesCount?: InputMaybe<Scalars['Int']['input']>;
  votesCount_gt?: InputMaybe<Scalars['Int']['input']>;
  votesCount_gte?: InputMaybe<Scalars['Int']['input']>;
  votesCount_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  votesCount_lt?: InputMaybe<Scalars['Int']['input']>;
  votesCount_lte?: InputMaybe<Scalars['Int']['input']>;
  votesCount_not?: InputMaybe<Scalars['Int']['input']>;
  votesCount_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  votingPower?: InputMaybe<Scalars['BigInt']['input']>;
  votingPower_gt?: InputMaybe<Scalars['BigInt']['input']>;
  votingPower_gte?: InputMaybe<Scalars['BigInt']['input']>;
  votingPower_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  votingPower_lt?: InputMaybe<Scalars['BigInt']['input']>;
  votingPower_lte?: InputMaybe<Scalars['BigInt']['input']>;
  votingPower_not?: InputMaybe<Scalars['BigInt']['input']>;
  votingPower_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
};

export type AccountPowerPage = {
  __typename?: 'accountPowerPage';
  items: Array<AccountPower>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type CompareActiveSupply_200_Response = {
  __typename?: 'compareActiveSupply_200_response';
  activeSupply: Scalars['String']['output'];
};

export type CompareAverageTurnout_200_Response = {
  __typename?: 'compareAverageTurnout_200_response';
  changeRate: Scalars['Float']['output'];
  currentAverageTurnout: Scalars['Float']['output'];
  oldAverageTurnout: Scalars['Float']['output'];
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

export type Dao = {
  __typename?: 'dao';
  id: Scalars['String']['output'];
  proposalThreshold: Scalars['BigInt']['output'];
  quorum: Scalars['BigInt']['output'];
  timelockDelay: Scalars['BigInt']['output'];
  votingDelay: Scalars['BigInt']['output'];
  votingPeriod: Scalars['BigInt']['output'];
};

export type DaoFilter = {
  AND?: InputMaybe<Array<InputMaybe<DaoFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<DaoFilter>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  proposalThreshold?: InputMaybe<Scalars['BigInt']['input']>;
  proposalThreshold_gt?: InputMaybe<Scalars['BigInt']['input']>;
  proposalThreshold_gte?: InputMaybe<Scalars['BigInt']['input']>;
  proposalThreshold_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  proposalThreshold_lt?: InputMaybe<Scalars['BigInt']['input']>;
  proposalThreshold_lte?: InputMaybe<Scalars['BigInt']['input']>;
  proposalThreshold_not?: InputMaybe<Scalars['BigInt']['input']>;
  proposalThreshold_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  quorum?: InputMaybe<Scalars['BigInt']['input']>;
  quorum_gt?: InputMaybe<Scalars['BigInt']['input']>;
  quorum_gte?: InputMaybe<Scalars['BigInt']['input']>;
  quorum_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  quorum_lt?: InputMaybe<Scalars['BigInt']['input']>;
  quorum_lte?: InputMaybe<Scalars['BigInt']['input']>;
  quorum_not?: InputMaybe<Scalars['BigInt']['input']>;
  quorum_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timelockDelay?: InputMaybe<Scalars['BigInt']['input']>;
  timelockDelay_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timelockDelay_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timelockDelay_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timelockDelay_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timelockDelay_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timelockDelay_not?: InputMaybe<Scalars['BigInt']['input']>;
  timelockDelay_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  votingDelay?: InputMaybe<Scalars['BigInt']['input']>;
  votingDelay_gt?: InputMaybe<Scalars['BigInt']['input']>;
  votingDelay_gte?: InputMaybe<Scalars['BigInt']['input']>;
  votingDelay_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  votingDelay_lt?: InputMaybe<Scalars['BigInt']['input']>;
  votingDelay_lte?: InputMaybe<Scalars['BigInt']['input']>;
  votingDelay_not?: InputMaybe<Scalars['BigInt']['input']>;
  votingDelay_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  votingPeriod?: InputMaybe<Scalars['BigInt']['input']>;
  votingPeriod_gt?: InputMaybe<Scalars['BigInt']['input']>;
  votingPeriod_gte?: InputMaybe<Scalars['BigInt']['input']>;
  votingPeriod_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  votingPeriod_lt?: InputMaybe<Scalars['BigInt']['input']>;
  votingPeriod_lte?: InputMaybe<Scalars['BigInt']['input']>;
  votingPeriod_not?: InputMaybe<Scalars['BigInt']['input']>;
  votingPeriod_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
};

export type DaoMetricsDayBucket = {
  __typename?: 'daoMetricsDayBucket';
  average: Scalars['BigInt']['output'];
  close: Scalars['BigInt']['output'];
  count: Scalars['Int']['output'];
  daoId: Scalars['String']['output'];
  date: Scalars['BigInt']['output'];
  high: Scalars['BigInt']['output'];
  low: Scalars['BigInt']['output'];
  metricType: MetricType;
  open: Scalars['BigInt']['output'];
  tokenId: Scalars['String']['output'];
  volume: Scalars['BigInt']['output'];
};

export type DaoMetricsDayBucketFilter = {
  AND?: InputMaybe<Array<InputMaybe<DaoMetricsDayBucketFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<DaoMetricsDayBucketFilter>>>;
  average?: InputMaybe<Scalars['BigInt']['input']>;
  average_gt?: InputMaybe<Scalars['BigInt']['input']>;
  average_gte?: InputMaybe<Scalars['BigInt']['input']>;
  average_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  average_lt?: InputMaybe<Scalars['BigInt']['input']>;
  average_lte?: InputMaybe<Scalars['BigInt']['input']>;
  average_not?: InputMaybe<Scalars['BigInt']['input']>;
  average_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  close?: InputMaybe<Scalars['BigInt']['input']>;
  close_gt?: InputMaybe<Scalars['BigInt']['input']>;
  close_gte?: InputMaybe<Scalars['BigInt']['input']>;
  close_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  close_lt?: InputMaybe<Scalars['BigInt']['input']>;
  close_lte?: InputMaybe<Scalars['BigInt']['input']>;
  close_not?: InputMaybe<Scalars['BigInt']['input']>;
  close_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  count?: InputMaybe<Scalars['Int']['input']>;
  count_gt?: InputMaybe<Scalars['Int']['input']>;
  count_gte?: InputMaybe<Scalars['Int']['input']>;
  count_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  count_lt?: InputMaybe<Scalars['Int']['input']>;
  count_lte?: InputMaybe<Scalars['Int']['input']>;
  count_not?: InputMaybe<Scalars['Int']['input']>;
  count_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  daoId?: InputMaybe<Scalars['String']['input']>;
  daoId_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not?: InputMaybe<Scalars['String']['input']>;
  daoId_not_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  daoId_starts_with?: InputMaybe<Scalars['String']['input']>;
  date?: InputMaybe<Scalars['BigInt']['input']>;
  date_gt?: InputMaybe<Scalars['BigInt']['input']>;
  date_gte?: InputMaybe<Scalars['BigInt']['input']>;
  date_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  date_lt?: InputMaybe<Scalars['BigInt']['input']>;
  date_lte?: InputMaybe<Scalars['BigInt']['input']>;
  date_not?: InputMaybe<Scalars['BigInt']['input']>;
  date_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  high?: InputMaybe<Scalars['BigInt']['input']>;
  high_gt?: InputMaybe<Scalars['BigInt']['input']>;
  high_gte?: InputMaybe<Scalars['BigInt']['input']>;
  high_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  high_lt?: InputMaybe<Scalars['BigInt']['input']>;
  high_lte?: InputMaybe<Scalars['BigInt']['input']>;
  high_not?: InputMaybe<Scalars['BigInt']['input']>;
  high_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  low?: InputMaybe<Scalars['BigInt']['input']>;
  low_gt?: InputMaybe<Scalars['BigInt']['input']>;
  low_gte?: InputMaybe<Scalars['BigInt']['input']>;
  low_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  low_lt?: InputMaybe<Scalars['BigInt']['input']>;
  low_lte?: InputMaybe<Scalars['BigInt']['input']>;
  low_not?: InputMaybe<Scalars['BigInt']['input']>;
  low_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  metricType?: InputMaybe<MetricType>;
  metricType_in?: InputMaybe<Array<InputMaybe<MetricType>>>;
  metricType_not?: InputMaybe<MetricType>;
  metricType_not_in?: InputMaybe<Array<InputMaybe<MetricType>>>;
  open?: InputMaybe<Scalars['BigInt']['input']>;
  open_gt?: InputMaybe<Scalars['BigInt']['input']>;
  open_gte?: InputMaybe<Scalars['BigInt']['input']>;
  open_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  open_lt?: InputMaybe<Scalars['BigInt']['input']>;
  open_lte?: InputMaybe<Scalars['BigInt']['input']>;
  open_not?: InputMaybe<Scalars['BigInt']['input']>;
  open_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  tokenId?: InputMaybe<Scalars['String']['input']>;
  tokenId_contains?: InputMaybe<Scalars['String']['input']>;
  tokenId_ends_with?: InputMaybe<Scalars['String']['input']>;
  tokenId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tokenId_not?: InputMaybe<Scalars['String']['input']>;
  tokenId_not_contains?: InputMaybe<Scalars['String']['input']>;
  tokenId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  tokenId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tokenId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  tokenId_starts_with?: InputMaybe<Scalars['String']['input']>;
  volume?: InputMaybe<Scalars['BigInt']['input']>;
  volume_gt?: InputMaybe<Scalars['BigInt']['input']>;
  volume_gte?: InputMaybe<Scalars['BigInt']['input']>;
  volume_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  volume_lt?: InputMaybe<Scalars['BigInt']['input']>;
  volume_lte?: InputMaybe<Scalars['BigInt']['input']>;
  volume_not?: InputMaybe<Scalars['BigInt']['input']>;
  volume_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
};

export type DaoMetricsDayBucketPage = {
  __typename?: 'daoMetricsDayBucketPage';
  items: Array<DaoMetricsDayBucket>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type DaoPage = {
  __typename?: 'daoPage';
  items: Array<Dao>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type Delegation = {
  __typename?: 'delegation';
  daoId: Scalars['String']['output'];
  delegate?: Maybe<Account>;
  delegateAccountId?: Maybe<Scalars['String']['output']>;
  delegatedValue: Scalars['BigInt']['output'];
  delegator?: Maybe<Account>;
  delegatorAccountId?: Maybe<Scalars['String']['output']>;
  previousDelegate?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['BigInt']['output']>;
  transactionHash: Scalars['String']['output'];
};

export type DelegationFilter = {
  AND?: InputMaybe<Array<InputMaybe<DelegationFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<DelegationFilter>>>;
  daoId?: InputMaybe<Scalars['String']['input']>;
  daoId_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not?: InputMaybe<Scalars['String']['input']>;
  daoId_not_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  daoId_starts_with?: InputMaybe<Scalars['String']['input']>;
  delegateAccountId?: InputMaybe<Scalars['String']['input']>;
  delegateAccountId_contains?: InputMaybe<Scalars['String']['input']>;
  delegateAccountId_ends_with?: InputMaybe<Scalars['String']['input']>;
  delegateAccountId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  delegateAccountId_not?: InputMaybe<Scalars['String']['input']>;
  delegateAccountId_not_contains?: InputMaybe<Scalars['String']['input']>;
  delegateAccountId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  delegateAccountId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  delegateAccountId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  delegateAccountId_starts_with?: InputMaybe<Scalars['String']['input']>;
  delegatedValue?: InputMaybe<Scalars['BigInt']['input']>;
  delegatedValue_gt?: InputMaybe<Scalars['BigInt']['input']>;
  delegatedValue_gte?: InputMaybe<Scalars['BigInt']['input']>;
  delegatedValue_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  delegatedValue_lt?: InputMaybe<Scalars['BigInt']['input']>;
  delegatedValue_lte?: InputMaybe<Scalars['BigInt']['input']>;
  delegatedValue_not?: InputMaybe<Scalars['BigInt']['input']>;
  delegatedValue_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  delegatorAccountId?: InputMaybe<Scalars['String']['input']>;
  delegatorAccountId_contains?: InputMaybe<Scalars['String']['input']>;
  delegatorAccountId_ends_with?: InputMaybe<Scalars['String']['input']>;
  delegatorAccountId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  delegatorAccountId_not?: InputMaybe<Scalars['String']['input']>;
  delegatorAccountId_not_contains?: InputMaybe<Scalars['String']['input']>;
  delegatorAccountId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  delegatorAccountId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  delegatorAccountId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  delegatorAccountId_starts_with?: InputMaybe<Scalars['String']['input']>;
  previousDelegate?: InputMaybe<Scalars['String']['input']>;
  previousDelegate_contains?: InputMaybe<Scalars['String']['input']>;
  previousDelegate_ends_with?: InputMaybe<Scalars['String']['input']>;
  previousDelegate_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  previousDelegate_not?: InputMaybe<Scalars['String']['input']>;
  previousDelegate_not_contains?: InputMaybe<Scalars['String']['input']>;
  previousDelegate_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  previousDelegate_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  previousDelegate_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  previousDelegate_starts_with?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  transactionHash?: InputMaybe<Scalars['String']['input']>;
  transactionHash_contains?: InputMaybe<Scalars['String']['input']>;
  transactionHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  transactionHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  transactionHash_not?: InputMaybe<Scalars['String']['input']>;
  transactionHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  transactionHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  transactionHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  transactionHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  transactionHash_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type DelegationPage = {
  __typename?: 'delegationPage';
  items: Array<Delegation>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type HistoricalTokenData_200_Response = {
  __typename?: 'historicalTokenData_200_response';
  market_caps: Array<Maybe<Array<Maybe<Scalars['Float']['output']>>>>;
  prices: Array<Maybe<Array<Maybe<Scalars['Float']['output']>>>>;
  total_volumes: Array<Maybe<Array<Maybe<Scalars['Float']['output']>>>>;
};

export enum MetricType {
  CexSupply = 'CEX_SUPPLY',
  CirculatingSupply = 'CIRCULATING_SUPPLY',
  DelegatedSupply = 'DELEGATED_SUPPLY',
  DexSupply = 'DEX_SUPPLY',
  LendingSupply = 'LENDING_SUPPLY',
  TotalSupply = 'TOTAL_SUPPLY',
  Treasury = 'TREASURY'
}

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

export type ProposalsOnchain = {
  __typename?: 'proposalsOnchain';
  abstainVotes: Scalars['BigInt']['output'];
  againstVotes: Scalars['BigInt']['output'];
  calldatas?: Maybe<Scalars['JSON']['output']>;
  daoId: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  endBlock?: Maybe<Scalars['String']['output']>;
  forVotes: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  proposer?: Maybe<Account>;
  proposerAccountId?: Maybe<Scalars['String']['output']>;
  signatures?: Maybe<Scalars['JSON']['output']>;
  startBlock?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  targets?: Maybe<Scalars['JSON']['output']>;
  timestamp?: Maybe<Scalars['BigInt']['output']>;
  values?: Maybe<Scalars['JSON']['output']>;
  votes?: Maybe<VotesOnchainPage>;
};


export type ProposalsOnchainVotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<VotesOnchainFilter>;
};

export type ProposalsOnchainFilter = {
  AND?: InputMaybe<Array<InputMaybe<ProposalsOnchainFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<ProposalsOnchainFilter>>>;
  abstainVotes?: InputMaybe<Scalars['BigInt']['input']>;
  abstainVotes_gt?: InputMaybe<Scalars['BigInt']['input']>;
  abstainVotes_gte?: InputMaybe<Scalars['BigInt']['input']>;
  abstainVotes_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  abstainVotes_lt?: InputMaybe<Scalars['BigInt']['input']>;
  abstainVotes_lte?: InputMaybe<Scalars['BigInt']['input']>;
  abstainVotes_not?: InputMaybe<Scalars['BigInt']['input']>;
  abstainVotes_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  againstVotes?: InputMaybe<Scalars['BigInt']['input']>;
  againstVotes_gt?: InputMaybe<Scalars['BigInt']['input']>;
  againstVotes_gte?: InputMaybe<Scalars['BigInt']['input']>;
  againstVotes_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  againstVotes_lt?: InputMaybe<Scalars['BigInt']['input']>;
  againstVotes_lte?: InputMaybe<Scalars['BigInt']['input']>;
  againstVotes_not?: InputMaybe<Scalars['BigInt']['input']>;
  againstVotes_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  daoId?: InputMaybe<Scalars['String']['input']>;
  daoId_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not?: InputMaybe<Scalars['String']['input']>;
  daoId_not_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  daoId_starts_with?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  description_contains?: InputMaybe<Scalars['String']['input']>;
  description_ends_with?: InputMaybe<Scalars['String']['input']>;
  description_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  description_not?: InputMaybe<Scalars['String']['input']>;
  description_not_contains?: InputMaybe<Scalars['String']['input']>;
  description_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  description_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  description_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  description_starts_with?: InputMaybe<Scalars['String']['input']>;
  endBlock?: InputMaybe<Scalars['String']['input']>;
  endBlock_contains?: InputMaybe<Scalars['String']['input']>;
  endBlock_ends_with?: InputMaybe<Scalars['String']['input']>;
  endBlock_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  endBlock_not?: InputMaybe<Scalars['String']['input']>;
  endBlock_not_contains?: InputMaybe<Scalars['String']['input']>;
  endBlock_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  endBlock_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  endBlock_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  endBlock_starts_with?: InputMaybe<Scalars['String']['input']>;
  forVotes?: InputMaybe<Scalars['BigInt']['input']>;
  forVotes_gt?: InputMaybe<Scalars['BigInt']['input']>;
  forVotes_gte?: InputMaybe<Scalars['BigInt']['input']>;
  forVotes_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  forVotes_lt?: InputMaybe<Scalars['BigInt']['input']>;
  forVotes_lte?: InputMaybe<Scalars['BigInt']['input']>;
  forVotes_not?: InputMaybe<Scalars['BigInt']['input']>;
  forVotes_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  proposerAccountId?: InputMaybe<Scalars['String']['input']>;
  proposerAccountId_contains?: InputMaybe<Scalars['String']['input']>;
  proposerAccountId_ends_with?: InputMaybe<Scalars['String']['input']>;
  proposerAccountId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  proposerAccountId_not?: InputMaybe<Scalars['String']['input']>;
  proposerAccountId_not_contains?: InputMaybe<Scalars['String']['input']>;
  proposerAccountId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  proposerAccountId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  proposerAccountId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  proposerAccountId_starts_with?: InputMaybe<Scalars['String']['input']>;
  startBlock?: InputMaybe<Scalars['String']['input']>;
  startBlock_contains?: InputMaybe<Scalars['String']['input']>;
  startBlock_ends_with?: InputMaybe<Scalars['String']['input']>;
  startBlock_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  startBlock_not?: InputMaybe<Scalars['String']['input']>;
  startBlock_not_contains?: InputMaybe<Scalars['String']['input']>;
  startBlock_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  startBlock_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  startBlock_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  startBlock_starts_with?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  status_contains?: InputMaybe<Scalars['String']['input']>;
  status_ends_with?: InputMaybe<Scalars['String']['input']>;
  status_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status_not?: InputMaybe<Scalars['String']['input']>;
  status_not_contains?: InputMaybe<Scalars['String']['input']>;
  status_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  status_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  status_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  status_starts_with?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
};

export type ProposalsOnchainPage = {
  __typename?: 'proposalsOnchainPage';
  items: Array<ProposalsOnchain>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

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

export enum QueryInput_HistoricalBalances_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_HistoricalVotingPower_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
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

export enum QueryInput_TotalAssets_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export type Query_HistoricalBalances_Items = {
  __typename?: 'query_historicalBalances_items';
  address: Scalars['String']['output'];
  balance: Scalars['String']['output'];
  blockNumber: Scalars['Float']['output'];
  tokenAddress: Scalars['String']['output'];
};

export type Query_HistoricalVotingPower_Items = {
  __typename?: 'query_historicalVotingPower_items';
  address: Scalars['String']['output'];
  blockNumber: Scalars['Float']['output'];
  tokenAddress: Scalars['String']['output'];
  votingPower: Scalars['String']['output'];
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
  endBlock: Scalars['String']['output'];
  forVotes: Scalars['String']['output'];
  id: Scalars['String']['output'];
  proposerAccountId: Scalars['String']['output'];
  startBlock: Scalars['String']['output'];
  status: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
};

export type Query_ProposalsActivity_Proposals_Items_UserVote = {
  __typename?: 'query_proposalsActivity_proposals_items_userVote';
  id: Scalars['String']['output'];
  proposalId: Scalars['String']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  support?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['String']['output'];
  voterAccountId: Scalars['String']['output'];
  votingPower?: Maybe<Scalars['String']['output']>;
};

export type Query_TotalAssets_Items = {
  __typename?: 'query_totalAssets_items';
  date: Scalars['String']['output'];
  totalAssets: Scalars['String']['output'];
};

export type Token = {
  __typename?: 'token';
  cexSupply: Scalars['BigInt']['output'];
  circulatingSupply: Scalars['BigInt']['output'];
  decimals: Scalars['Int']['output'];
  delegatedSupply: Scalars['BigInt']['output'];
  dexSupply: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  lendingSupply: Scalars['BigInt']['output'];
  name?: Maybe<Scalars['String']['output']>;
  totalSupply: Scalars['BigInt']['output'];
  treasury: Scalars['BigInt']['output'];
};

export type TokenFilter = {
  AND?: InputMaybe<Array<InputMaybe<TokenFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<TokenFilter>>>;
  cexSupply?: InputMaybe<Scalars['BigInt']['input']>;
  cexSupply_gt?: InputMaybe<Scalars['BigInt']['input']>;
  cexSupply_gte?: InputMaybe<Scalars['BigInt']['input']>;
  cexSupply_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  cexSupply_lt?: InputMaybe<Scalars['BigInt']['input']>;
  cexSupply_lte?: InputMaybe<Scalars['BigInt']['input']>;
  cexSupply_not?: InputMaybe<Scalars['BigInt']['input']>;
  cexSupply_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  circulatingSupply?: InputMaybe<Scalars['BigInt']['input']>;
  circulatingSupply_gt?: InputMaybe<Scalars['BigInt']['input']>;
  circulatingSupply_gte?: InputMaybe<Scalars['BigInt']['input']>;
  circulatingSupply_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  circulatingSupply_lt?: InputMaybe<Scalars['BigInt']['input']>;
  circulatingSupply_lte?: InputMaybe<Scalars['BigInt']['input']>;
  circulatingSupply_not?: InputMaybe<Scalars['BigInt']['input']>;
  circulatingSupply_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  decimals?: InputMaybe<Scalars['Int']['input']>;
  decimals_gt?: InputMaybe<Scalars['Int']['input']>;
  decimals_gte?: InputMaybe<Scalars['Int']['input']>;
  decimals_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  decimals_lt?: InputMaybe<Scalars['Int']['input']>;
  decimals_lte?: InputMaybe<Scalars['Int']['input']>;
  decimals_not?: InputMaybe<Scalars['Int']['input']>;
  decimals_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  delegatedSupply?: InputMaybe<Scalars['BigInt']['input']>;
  delegatedSupply_gt?: InputMaybe<Scalars['BigInt']['input']>;
  delegatedSupply_gte?: InputMaybe<Scalars['BigInt']['input']>;
  delegatedSupply_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  delegatedSupply_lt?: InputMaybe<Scalars['BigInt']['input']>;
  delegatedSupply_lte?: InputMaybe<Scalars['BigInt']['input']>;
  delegatedSupply_not?: InputMaybe<Scalars['BigInt']['input']>;
  delegatedSupply_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  dexSupply?: InputMaybe<Scalars['BigInt']['input']>;
  dexSupply_gt?: InputMaybe<Scalars['BigInt']['input']>;
  dexSupply_gte?: InputMaybe<Scalars['BigInt']['input']>;
  dexSupply_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  dexSupply_lt?: InputMaybe<Scalars['BigInt']['input']>;
  dexSupply_lte?: InputMaybe<Scalars['BigInt']['input']>;
  dexSupply_not?: InputMaybe<Scalars['BigInt']['input']>;
  dexSupply_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  lendingSupply?: InputMaybe<Scalars['BigInt']['input']>;
  lendingSupply_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lendingSupply_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lendingSupply_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  lendingSupply_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lendingSupply_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lendingSupply_not?: InputMaybe<Scalars['BigInt']['input']>;
  lendingSupply_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  name?: InputMaybe<Scalars['String']['input']>;
  name_contains?: InputMaybe<Scalars['String']['input']>;
  name_ends_with?: InputMaybe<Scalars['String']['input']>;
  name_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  name_not?: InputMaybe<Scalars['String']['input']>;
  name_not_contains?: InputMaybe<Scalars['String']['input']>;
  name_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  name_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  name_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  name_starts_with?: InputMaybe<Scalars['String']['input']>;
  totalSupply?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupply_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupply_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupply_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  totalSupply_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupply_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupply_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupply_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  treasury?: InputMaybe<Scalars['BigInt']['input']>;
  treasury_gt?: InputMaybe<Scalars['BigInt']['input']>;
  treasury_gte?: InputMaybe<Scalars['BigInt']['input']>;
  treasury_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  treasury_lt?: InputMaybe<Scalars['BigInt']['input']>;
  treasury_lte?: InputMaybe<Scalars['BigInt']['input']>;
  treasury_not?: InputMaybe<Scalars['BigInt']['input']>;
  treasury_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
};

export type TokenPage = {
  __typename?: 'tokenPage';
  items: Array<Token>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type Transfer = {
  __typename?: 'transfer';
  amount?: Maybe<Scalars['BigInt']['output']>;
  daoId: Scalars['String']['output'];
  from?: Maybe<Account>;
  fromAccountId?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['BigInt']['output']>;
  to?: Maybe<Account>;
  toAccountId?: Maybe<Scalars['String']['output']>;
  token?: Maybe<Token>;
  tokenId?: Maybe<Scalars['String']['output']>;
  transactionHash: Scalars['String']['output'];
};

export type TransferFilter = {
  AND?: InputMaybe<Array<InputMaybe<TransferFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<TransferFilter>>>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  daoId?: InputMaybe<Scalars['String']['input']>;
  daoId_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not?: InputMaybe<Scalars['String']['input']>;
  daoId_not_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  daoId_starts_with?: InputMaybe<Scalars['String']['input']>;
  fromAccountId?: InputMaybe<Scalars['String']['input']>;
  fromAccountId_contains?: InputMaybe<Scalars['String']['input']>;
  fromAccountId_ends_with?: InputMaybe<Scalars['String']['input']>;
  fromAccountId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromAccountId_not?: InputMaybe<Scalars['String']['input']>;
  fromAccountId_not_contains?: InputMaybe<Scalars['String']['input']>;
  fromAccountId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  fromAccountId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromAccountId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  fromAccountId_starts_with?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  toAccountId?: InputMaybe<Scalars['String']['input']>;
  toAccountId_contains?: InputMaybe<Scalars['String']['input']>;
  toAccountId_ends_with?: InputMaybe<Scalars['String']['input']>;
  toAccountId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  toAccountId_not?: InputMaybe<Scalars['String']['input']>;
  toAccountId_not_contains?: InputMaybe<Scalars['String']['input']>;
  toAccountId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  toAccountId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  toAccountId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  toAccountId_starts_with?: InputMaybe<Scalars['String']['input']>;
  tokenId?: InputMaybe<Scalars['String']['input']>;
  tokenId_contains?: InputMaybe<Scalars['String']['input']>;
  tokenId_ends_with?: InputMaybe<Scalars['String']['input']>;
  tokenId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tokenId_not?: InputMaybe<Scalars['String']['input']>;
  tokenId_not_contains?: InputMaybe<Scalars['String']['input']>;
  tokenId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  tokenId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  tokenId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  tokenId_starts_with?: InputMaybe<Scalars['String']['input']>;
  transactionHash?: InputMaybe<Scalars['String']['input']>;
  transactionHash_contains?: InputMaybe<Scalars['String']['input']>;
  transactionHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  transactionHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  transactionHash_not?: InputMaybe<Scalars['String']['input']>;
  transactionHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  transactionHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  transactionHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  transactionHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  transactionHash_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type TransferPage = {
  __typename?: 'transferPage';
  items: Array<Transfer>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type VotesOnchain = {
  __typename?: 'votesOnchain';
  daoId: Scalars['String']['output'];
  proposal?: Maybe<ProposalsOnchain>;
  proposalId?: Maybe<Scalars['String']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  support?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['BigInt']['output']>;
  txHash?: Maybe<Scalars['String']['output']>;
  voter?: Maybe<Account>;
  voterAccountId?: Maybe<Scalars['String']['output']>;
  votingPower?: Maybe<Scalars['String']['output']>;
};

export type VotesOnchainFilter = {
  AND?: InputMaybe<Array<InputMaybe<VotesOnchainFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<VotesOnchainFilter>>>;
  daoId?: InputMaybe<Scalars['String']['input']>;
  daoId_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not?: InputMaybe<Scalars['String']['input']>;
  daoId_not_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  daoId_starts_with?: InputMaybe<Scalars['String']['input']>;
  proposalId?: InputMaybe<Scalars['String']['input']>;
  proposalId_contains?: InputMaybe<Scalars['String']['input']>;
  proposalId_ends_with?: InputMaybe<Scalars['String']['input']>;
  proposalId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  proposalId_not?: InputMaybe<Scalars['String']['input']>;
  proposalId_not_contains?: InputMaybe<Scalars['String']['input']>;
  proposalId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  proposalId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  proposalId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  proposalId_starts_with?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  reason_contains?: InputMaybe<Scalars['String']['input']>;
  reason_ends_with?: InputMaybe<Scalars['String']['input']>;
  reason_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  reason_not?: InputMaybe<Scalars['String']['input']>;
  reason_not_contains?: InputMaybe<Scalars['String']['input']>;
  reason_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  reason_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  reason_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  reason_starts_with?: InputMaybe<Scalars['String']['input']>;
  support?: InputMaybe<Scalars['String']['input']>;
  support_contains?: InputMaybe<Scalars['String']['input']>;
  support_ends_with?: InputMaybe<Scalars['String']['input']>;
  support_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  support_not?: InputMaybe<Scalars['String']['input']>;
  support_not_contains?: InputMaybe<Scalars['String']['input']>;
  support_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  support_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  support_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  support_starts_with?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  voterAccountId?: InputMaybe<Scalars['String']['input']>;
  voterAccountId_contains?: InputMaybe<Scalars['String']['input']>;
  voterAccountId_ends_with?: InputMaybe<Scalars['String']['input']>;
  voterAccountId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  voterAccountId_not?: InputMaybe<Scalars['String']['input']>;
  voterAccountId_not_contains?: InputMaybe<Scalars['String']['input']>;
  voterAccountId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  voterAccountId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  voterAccountId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  voterAccountId_starts_with?: InputMaybe<Scalars['String']['input']>;
  votingPower?: InputMaybe<Scalars['String']['input']>;
  votingPower_contains?: InputMaybe<Scalars['String']['input']>;
  votingPower_ends_with?: InputMaybe<Scalars['String']['input']>;
  votingPower_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  votingPower_not?: InputMaybe<Scalars['String']['input']>;
  votingPower_not_contains?: InputMaybe<Scalars['String']['input']>;
  votingPower_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  votingPower_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  votingPower_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  votingPower_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type VotesOnchainPage = {
  __typename?: 'votesOnchainPage';
  items: Array<VotesOnchain>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type VotingPowerHistory = {
  __typename?: 'votingPowerHistory';
  account?: Maybe<Account>;
  accountId?: Maybe<Scalars['String']['output']>;
  daoId: Scalars['String']['output'];
  delegation?: Maybe<Delegation>;
  delta: Scalars['BigInt']['output'];
  timestamp: Scalars['BigInt']['output'];
  transactionHash: Scalars['String']['output'];
  transfer?: Maybe<Transfer>;
  votingPower: Scalars['BigInt']['output'];
};

export type VotingPowerHistoryFilter = {
  AND?: InputMaybe<Array<InputMaybe<VotingPowerHistoryFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<VotingPowerHistoryFilter>>>;
  accountId?: InputMaybe<Scalars['String']['input']>;
  accountId_contains?: InputMaybe<Scalars['String']['input']>;
  accountId_ends_with?: InputMaybe<Scalars['String']['input']>;
  accountId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  accountId_not?: InputMaybe<Scalars['String']['input']>;
  accountId_not_contains?: InputMaybe<Scalars['String']['input']>;
  accountId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  accountId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  accountId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  accountId_starts_with?: InputMaybe<Scalars['String']['input']>;
  daoId?: InputMaybe<Scalars['String']['input']>;
  daoId_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not?: InputMaybe<Scalars['String']['input']>;
  daoId_not_contains?: InputMaybe<Scalars['String']['input']>;
  daoId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  daoId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  daoId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  daoId_starts_with?: InputMaybe<Scalars['String']['input']>;
  delta?: InputMaybe<Scalars['BigInt']['input']>;
  delta_gt?: InputMaybe<Scalars['BigInt']['input']>;
  delta_gte?: InputMaybe<Scalars['BigInt']['input']>;
  delta_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  delta_lt?: InputMaybe<Scalars['BigInt']['input']>;
  delta_lte?: InputMaybe<Scalars['BigInt']['input']>;
  delta_not?: InputMaybe<Scalars['BigInt']['input']>;
  delta_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  transactionHash?: InputMaybe<Scalars['String']['input']>;
  transactionHash_contains?: InputMaybe<Scalars['String']['input']>;
  transactionHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  transactionHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  transactionHash_not?: InputMaybe<Scalars['String']['input']>;
  transactionHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  transactionHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  transactionHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  transactionHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  transactionHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  votingPower?: InputMaybe<Scalars['BigInt']['input']>;
  votingPower_gt?: InputMaybe<Scalars['BigInt']['input']>;
  votingPower_gte?: InputMaybe<Scalars['BigInt']['input']>;
  votingPower_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  votingPower_lt?: InputMaybe<Scalars['BigInt']['input']>;
  votingPower_lte?: InputMaybe<Scalars['BigInt']['input']>;
  votingPower_not?: InputMaybe<Scalars['BigInt']['input']>;
  votingPower_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
};

export type VotingPowerHistoryPage = {
  __typename?: 'votingPowerHistoryPage';
  items: Array<VotingPowerHistory>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type BalanceHistoryQueryVariables = Exact<{
  account: Scalars['String']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
}>;


export type BalanceHistoryQuery = { __typename?: 'Query', transfers: { __typename?: 'transferPage', items: Array<{ __typename?: 'transfer', timestamp?: any | null, amount?: any | null, fromAccountId?: string | null, toAccountId?: string | null, transactionHash: string }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

export type BalanceHistoryTotalCountQueryVariables = Exact<{
  account: Scalars['String']['input'];
}>;


export type BalanceHistoryTotalCountQuery = { __typename?: 'Query', transfers: { __typename?: 'transferPage', totalCount: number } };

export type BalanceHistoryBuyQueryVariables = Exact<{
  account: Scalars['String']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
}>;


export type BalanceHistoryBuyQuery = { __typename?: 'Query', transfers: { __typename?: 'transferPage', items: Array<{ __typename?: 'transfer', timestamp?: any | null, amount?: any | null, fromAccountId?: string | null, toAccountId?: string | null, transactionHash: string }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

export type BalanceHistoryBuyTotalCountQueryVariables = Exact<{
  account: Scalars['String']['input'];
}>;


export type BalanceHistoryBuyTotalCountQuery = { __typename?: 'Query', transfers: { __typename?: 'transferPage', totalCount: number } };

export type BalanceHistorySellQueryVariables = Exact<{
  account: Scalars['String']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
}>;


export type BalanceHistorySellQuery = { __typename?: 'Query', transfers: { __typename?: 'transferPage', items: Array<{ __typename?: 'transfer', timestamp?: any | null, amount?: any | null, fromAccountId?: string | null, toAccountId?: string | null, transactionHash: string }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

export type BalanceHistorySellTotalCountQueryVariables = Exact<{
  account: Scalars['String']['input'];
}>;


export type BalanceHistorySellTotalCountQuery = { __typename?: 'Query', transfers: { __typename?: 'transferPage', totalCount: number } };

export type GetDaoDataQueryVariables = Exact<{
  daoId: Scalars['String']['input'];
}>;


export type GetDaoDataQuery = { __typename?: 'Query', dao?: { __typename?: 'dao', id: string, quorum: any, proposalThreshold: any, votingDelay: any, votingPeriod: any, timelockDelay: any } | null };

export type GetDelegatorVotingPowerDetailsQueryVariables = Exact<{
  address: Scalars['String']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetDelegatorVotingPowerDetailsQuery = { __typename?: 'Query', accountPower?: { __typename?: 'accountPower', votingPower: any, accountId: string } | null, accountBalances: { __typename?: 'accountBalancePage', items: Array<{ __typename?: 'accountBalance', accountId: string, balance: any }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type GetDelegationsTimestampQueryVariables = Exact<{
  delegator: Array<Scalars['String']['input']> | Scalars['String']['input'];
  delegate: Scalars['String']['input'];
  daoId: Scalars['String']['input'];
}>;


export type GetDelegationsTimestampQuery = { __typename?: 'Query', delegations: { __typename?: 'delegationPage', items: Array<{ __typename?: 'delegation', delegatorAccountId?: string | null, timestamp?: any | null }> } };

export type GetTopFiveDelegatorsQueryVariables = Exact<{
  delegate: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetTopFiveDelegatorsQuery = { __typename?: 'Query', accountBalances: { __typename?: 'accountBalancePage', items: Array<{ __typename?: 'accountBalance', accountId: string, balance: any }> } };

export type GetVotingPowerCountingQueryVariables = Exact<{
  address: Scalars['String']['input'];
}>;


export type GetVotingPowerCountingQuery = { __typename?: 'Query', accountBalances: { __typename?: 'accountBalancePage', totalCount: number } };

export type GetDelegateDelegationHistoryQueryVariables = Exact<{
  accountId: Scalars['String']['input'];
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetDelegateDelegationHistoryQuery = { __typename?: 'Query', votingPowerHistorys: { __typename?: 'votingPowerHistoryPage', totalCount: number, items: Array<{ __typename?: 'votingPowerHistory', delta: any, transactionHash: string, timestamp: any, votingPower: any, delegation?: { __typename?: 'delegation', delegatorAccountId?: string | null, delegatedValue: any, previousDelegate?: string | null, delegateAccountId?: string | null } | null, transfer?: { __typename?: 'transfer', amount?: any | null, fromAccountId?: string | null, toAccountId?: string | null } | null }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type GetDelegateDelegationHistoryGraphQueryVariables = Exact<{
  accountId: Scalars['String']['input'];
  fromTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  toTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetDelegateDelegationHistoryGraphQuery = { __typename?: 'Query', votingPowerHistorys: { __typename?: 'votingPowerHistoryPage', totalCount: number, items: Array<{ __typename?: 'votingPowerHistory', delta: any, transactionHash: string, timestamp: any, votingPower: any, delegation?: { __typename?: 'delegation', delegatorAccountId?: string | null, delegatedValue: any, previousDelegate?: string | null, delegateAccountId?: string | null } | null, transfer?: { __typename?: 'transfer', amount?: any | null, fromAccountId?: string | null, toAccountId?: string | null } | null }> } };

export type GetDelegatesQueryVariables = Exact<{
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetDelegatesQuery = { __typename?: 'Query', accountPowers: { __typename?: 'accountPowerPage', items: Array<{ __typename?: 'accountPower', votingPower: any, accountId: string, delegationsCount: number }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

export type GetDelegatesCountQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDelegatesCountQuery = { __typename?: 'Query', accountPowers: { __typename?: 'accountPowerPage', totalCount: number } };

export type GetDelegationHistoryCountQueryVariables = Exact<{
  delegator: Scalars['String']['input'];
}>;


export type GetDelegationHistoryCountQuery = { __typename?: 'Query', delegations: { __typename?: 'delegationPage', totalCount: number } };

export type GetDelegationHistoryItemsQueryVariables = Exact<{
  delegator: Scalars['String']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetDelegationHistoryItemsQuery = { __typename?: 'Query', delegations: { __typename?: 'delegationPage', items: Array<{ __typename?: 'delegation', timestamp?: any | null, delegate?: { __typename?: 'account', id: string, powers?: { __typename?: 'accountPowerPage', items: Array<{ __typename?: 'accountPower', votingPower: any }> } | null } | null }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type GetHistoricalVotingAndActivityQueryVariables = Exact<{
  addresses: Scalars['JSON']['input'];
  address: Scalars['String']['input'];
  days: QueryInput_HistoricalVotingPower_Days;
  fromDate?: InputMaybe<Scalars['NonNegativeInt']['input']>;
}>;


export type GetHistoricalVotingAndActivityQuery = { __typename?: 'Query', historicalVotingPower?: Array<{ __typename?: 'query_historicalVotingPower_items', address: string, votingPower: string } | null> | null, proposalsActivity?: { __typename?: 'proposalsActivity_200_response', totalProposals: number, votedProposals: number, neverVoted: boolean } | null };

export type GetDelegateProposalsActivityQueryVariables = Exact<{
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['NonNegativeInt']['input']>;
}>;


export type GetDelegateProposalsActivityQuery = { __typename?: 'Query', proposalsActivity?: { __typename?: 'proposalsActivity_200_response', address: string, totalProposals: number, votedProposals: number, neverVoted: boolean } | null };

export type GetHistoricalBalancesQueryVariables = Exact<{
  addresses: Scalars['JSON']['input'];
  days: QueryInput_HistoricalBalances_Days;
}>;


export type GetHistoricalBalancesQuery = { __typename?: 'Query', historicalBalances?: Array<{ __typename?: 'query_historicalBalances_items', address: string, balance: string, blockNumber: number, tokenAddress: string } | null> | null };

export type GetProposalsActivityQueryVariables = Exact<{
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderBy?: InputMaybe<QueryInput_ProposalsActivity_OrderBy>;
  orderDirection?: InputMaybe<QueryInput_ProposalsActivity_OrderDirection>;
  userVoteFilter?: InputMaybe<QueryInput_ProposalsActivity_UserVoteFilter>;
}>;


export type GetProposalsActivityQuery = { __typename?: 'Query', proposalsActivity?: { __typename?: 'proposalsActivity_200_response', totalProposals: number, votedProposals: number, neverVoted: boolean, winRate: number, yesRate: number, avgTimeBeforeEnd: number, proposals: Array<{ __typename?: 'query_proposalsActivity_proposals_items', proposal: { __typename?: 'query_proposalsActivity_proposals_items_proposal', id: string, description?: string | null, startBlock: string, endBlock: string, status: string, againstVotes: string, forVotes: string, abstainVotes: string, timestamp: string, proposerAccountId: string, daoId: string }, userVote?: { __typename?: 'query_proposalsActivity_proposals_items_userVote', id: string, support?: string | null, votingPower?: string | null, reason?: string | null, timestamp: string, proposalId: string, voterAccountId: string } | null } | null> } | null };

export type GetDaoAddressesAccountBalancesQueryVariables = Exact<{
  tokenAddresses: Scalars['String']['input'];
  daoAddresses: Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>;
}>;


export type GetDaoAddressesAccountBalancesQuery = { __typename?: 'Query', accountBalances: { __typename?: 'accountBalancePage', items: Array<{ __typename?: 'accountBalance', accountId: string, balance: any }> } };

export type GetTopTokenHoldersQueryVariables = Exact<{
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetTopTokenHoldersQuery = { __typename?: 'Query', accountBalances: { __typename?: 'accountBalancePage', items: Array<{ __typename?: 'accountBalance', accountId: string, balance: any, delegate: string, tokenId: string }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

export type GetTokenHoldersCoutingQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTokenHoldersCoutingQuery = { __typename?: 'Query', accountBalances: { __typename?: 'accountBalancePage', totalCount: number } };
