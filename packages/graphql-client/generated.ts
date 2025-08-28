import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigInt: { input: any; output: any; }
  JSON: { input: any; output: any; }
  NonNegativeInt: { input: any; output: any; }
  ObjMap: { input: any; output: any; }
  PositiveInt: { input: any; output: any; }
  queryInput_transactions_maxAmount: { input: any; output: any; }
  queryInput_transactions_minAmount: { input: any; output: any; }
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
  _: TransactionPage;
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
  /** Get the last update time */
  lastUpdate?: Maybe<LastUpdate_200_Response>;
  /** Returns a single proposal by its ID */
  proposal?: Maybe<Proposal_200_Response>;
  /** Returns a list of proposal */
  proposals?: Maybe<Array<Maybe<Query_Proposals_Items>>>;
  /** Returns proposal activity data including voting history, win rates, and detailed proposal information for the specified delegate within the given time window */
  proposalsActivity?: Maybe<ProposalsActivity_200_Response>;
  proposalsOnchain?: Maybe<ProposalsOnchain>;
  proposalsOnchains: ProposalsOnchainPage;
  token?: Maybe<Token>;
  tokens: TokenPage;
  /** Get total assets */
  totalAssets?: Maybe<Array<Maybe<Query_TotalAssets_Items>>>;
  transaction?: Maybe<Transaction>;
  /** Get transactions with their associated transfers and delegations, with optional filtering and sorting */
  transactions?: Maybe<Transactions_200_Response>;
  transfer?: Maybe<Transfer>;
  transfers: TransferPage;
  votesOnchain?: Maybe<VotesOnchain>;
  votesOnchains: VotesOnchainPage;
  votingPowerHistory?: Maybe<VotingPowerHistory>;
  votingPowerHistorys: VotingPowerHistoryPage;
};


export type Query_Args = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<TransactionFilter>;
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
  delegateAccountId: Scalars['String']['input'];
  delegatorAccountId: Scalars['String']['input'];
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


export type QueryLastUpdateArgs = {
  chart: QueryInput_LastUpdate_Chart;
};


export type QueryProposalArgs = {
  id: Scalars['String']['input'];
};


export type QueryProposalsArgs = {
  fromDate?: InputMaybe<Scalars['Float']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  orderDirection?: InputMaybe<QueryInput_Proposals_OrderDirection>;
  skip?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  status?: InputMaybe<Scalars['JSON']['input']>;
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


export type QueryTransactionArgs = {
  transactionHash: Scalars['String']['input'];
};


export type QueryTransactionsArgs = {
  affectedSupply?: InputMaybe<Scalars['JSON']['input']>;
  from?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  maxAmount?: InputMaybe<Scalars['queryInput_transactions_maxAmount']['input']>;
  minAmount?: InputMaybe<Scalars['queryInput_transactions_minAmount']['input']>;
  offset?: InputMaybe<Scalars['NonNegativeInt']['input']>;
  sortBy?: InputMaybe<Timestamp_Const>;
  sortOrder?: InputMaybe<QueryInput_Transactions_SortOrder>;
  to?: InputMaybe<Scalars['String']['input']>;
};


export type QueryTransferArgs = {
  fromAccountId: Scalars['String']['input'];
  toAccountId: Scalars['String']['input'];
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
  chainId: Scalars['Int']['output'];
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
  chainId?: InputMaybe<Scalars['Int']['input']>;
  chainId_gt?: InputMaybe<Scalars['Int']['input']>;
  chainId_gte?: InputMaybe<Scalars['Int']['input']>;
  chainId_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  chainId_lt?: InputMaybe<Scalars['Int']['input']>;
  chainId_lte?: InputMaybe<Scalars['Int']['input']>;
  chainId_not?: InputMaybe<Scalars['Int']['input']>;
  chainId_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
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
  lastUpdate: Scalars['BigInt']['output'];
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
  lastUpdate?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdate_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdate_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdate_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  lastUpdate_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdate_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdate_not?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdate_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
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
  delegateAccountId: Scalars['String']['output'];
  delegatedValue: Scalars['BigInt']['output'];
  delegator?: Maybe<Account>;
  delegatorAccountId: Scalars['String']['output'];
  isCex: Scalars['Boolean']['output'];
  isDex: Scalars['Boolean']['output'];
  isLending: Scalars['Boolean']['output'];
  isTotal: Scalars['Boolean']['output'];
  logIndex: Scalars['Int']['output'];
  previousDelegate?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['BigInt']['output'];
  transaction?: Maybe<Transaction>;
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
  isCex?: InputMaybe<Scalars['Boolean']['input']>;
  isCex_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isCex_not?: InputMaybe<Scalars['Boolean']['input']>;
  isCex_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isDex?: InputMaybe<Scalars['Boolean']['input']>;
  isDex_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isDex_not?: InputMaybe<Scalars['Boolean']['input']>;
  isDex_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isLending?: InputMaybe<Scalars['Boolean']['input']>;
  isLending_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isLending_not?: InputMaybe<Scalars['Boolean']['input']>;
  isLending_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isTotal?: InputMaybe<Scalars['Boolean']['input']>;
  isTotal_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isTotal_not?: InputMaybe<Scalars['Boolean']['input']>;
  isTotal_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  logIndex?: InputMaybe<Scalars['Int']['input']>;
  logIndex_gt?: InputMaybe<Scalars['Int']['input']>;
  logIndex_gte?: InputMaybe<Scalars['Int']['input']>;
  logIndex_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  logIndex_lt?: InputMaybe<Scalars['Int']['input']>;
  logIndex_lte?: InputMaybe<Scalars['Int']['input']>;
  logIndex_not?: InputMaybe<Scalars['Int']['input']>;
  logIndex_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
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

export type LastUpdate_200_Response = {
  __typename?: 'lastUpdate_200_response';
  lastUpdate: Scalars['String']['output'];
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

export type Proposal_200_Response = {
  __typename?: 'proposal_200_response';
  abstainVotes: Scalars['String']['output'];
  againstVotes: Scalars['String']['output'];
  daoId: Scalars['String']['output'];
  description: Scalars['String']['output'];
  endBlock: Scalars['Float']['output'];
  endTimestamp: Scalars['String']['output'];
  forVotes: Scalars['String']['output'];
  id: Scalars['String']['output'];
  proposerAccountId: Scalars['String']['output'];
  quorum: Scalars['String']['output'];
  startBlock: Scalars['Float']['output'];
  startTimestamp: Scalars['String']['output'];
  status: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  txHash: Scalars['String']['output'];
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

export type ProposalsOnchain = {
  __typename?: 'proposalsOnchain';
  abstainVotes: Scalars['BigInt']['output'];
  againstVotes: Scalars['BigInt']['output'];
  calldatas: Scalars['JSON']['output'];
  daoId: Scalars['String']['output'];
  description: Scalars['String']['output'];
  endBlock: Scalars['Int']['output'];
  endTimestamp: Scalars['BigInt']['output'];
  forVotes: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  proposer?: Maybe<Account>;
  proposerAccountId: Scalars['String']['output'];
  signatures: Scalars['JSON']['output'];
  startBlock: Scalars['Int']['output'];
  status: Scalars['String']['output'];
  targets: Scalars['JSON']['output'];
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
  values: Scalars['JSON']['output'];
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
  endBlock?: InputMaybe<Scalars['Int']['input']>;
  endBlock_gt?: InputMaybe<Scalars['Int']['input']>;
  endBlock_gte?: InputMaybe<Scalars['Int']['input']>;
  endBlock_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  endBlock_lt?: InputMaybe<Scalars['Int']['input']>;
  endBlock_lte?: InputMaybe<Scalars['Int']['input']>;
  endBlock_not?: InputMaybe<Scalars['Int']['input']>;
  endBlock_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  endTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  endTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  endTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  endTimestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  endTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  endTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  endTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  endTimestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
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
  startBlock?: InputMaybe<Scalars['Int']['input']>;
  startBlock_gt?: InputMaybe<Scalars['Int']['input']>;
  startBlock_gte?: InputMaybe<Scalars['Int']['input']>;
  startBlock_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  startBlock_lt?: InputMaybe<Scalars['Int']['input']>;
  startBlock_lte?: InputMaybe<Scalars['Int']['input']>;
  startBlock_not?: InputMaybe<Scalars['Int']['input']>;
  startBlock_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
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

export enum QueryInput_LastUpdate_Chart {
  AttackProfitability = 'attack_profitability',
  CostComparison = 'cost_comparison',
  TokenDistribution = 'token_distribution'
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

export enum QueryInput_Proposals_OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum QueryInput_TotalAssets_Days {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

export enum QueryInput_Transactions_SortOrder {
  Asc = 'asc',
  Desc = 'desc'
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

export type Query_Proposals_Items = {
  __typename?: 'query_proposals_items';
  abstainVotes: Scalars['String']['output'];
  againstVotes: Scalars['String']['output'];
  daoId: Scalars['String']['output'];
  description: Scalars['String']['output'];
  endBlock: Scalars['Float']['output'];
  endTimestamp: Scalars['String']['output'];
  forVotes: Scalars['String']['output'];
  id: Scalars['String']['output'];
  proposerAccountId: Scalars['String']['output'];
  quorum: Scalars['String']['output'];
  startBlock: Scalars['Float']['output'];
  startTimestamp: Scalars['String']['output'];
  status: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  txHash: Scalars['String']['output'];
};

export type Query_TotalAssets_Items = {
  __typename?: 'query_totalAssets_items';
  date: Scalars['String']['output'];
  totalAssets: Scalars['String']['output'];
};

export type Query_Transactions_Transactions_Items = {
  __typename?: 'query_transactions_transactions_items';
  delegations: Array<Maybe<Query_Transactions_Transactions_Items_Delegations_Items>>;
  from?: Maybe<Scalars['String']['output']>;
  isCex: Scalars['Boolean']['output'];
  isDex: Scalars['Boolean']['output'];
  isLending: Scalars['Boolean']['output'];
  isTotal: Scalars['Boolean']['output'];
  timestamp: Scalars['String']['output'];
  to?: Maybe<Scalars['String']['output']>;
  transactionHash: Scalars['String']['output'];
  transfers: Array<Maybe<Query_Transactions_Transactions_Items_Transfers_Items>>;
};

export type Query_Transactions_Transactions_Items_Delegations_Items = {
  __typename?: 'query_transactions_transactions_items_delegations_items';
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

export type Query_Transactions_Transactions_Items_Transfers_Items = {
  __typename?: 'query_transactions_transactions_items_transfers_items';
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

export enum Timestamp_Const {
  Timestamp = 'timestamp'
}

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

export type Transaction = {
  __typename?: 'transaction';
  delegations?: Maybe<DelegationPage>;
  fromAddress?: Maybe<Scalars['String']['output']>;
  isCex: Scalars['Boolean']['output'];
  isDex: Scalars['Boolean']['output'];
  isLending: Scalars['Boolean']['output'];
  isTotal: Scalars['Boolean']['output'];
  timestamp: Scalars['BigInt']['output'];
  toAddress?: Maybe<Scalars['String']['output']>;
  transactionHash: Scalars['String']['output'];
  transfers?: Maybe<TransferPage>;
};


export type TransactionDelegationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<DelegationFilter>;
};


export type TransactionTransfersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<TransferFilter>;
};

export type TransactionFilter = {
  AND?: InputMaybe<Array<InputMaybe<TransactionFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<TransactionFilter>>>;
  fromAddress?: InputMaybe<Scalars['String']['input']>;
  fromAddress_contains?: InputMaybe<Scalars['String']['input']>;
  fromAddress_ends_with?: InputMaybe<Scalars['String']['input']>;
  fromAddress_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromAddress_not?: InputMaybe<Scalars['String']['input']>;
  fromAddress_not_contains?: InputMaybe<Scalars['String']['input']>;
  fromAddress_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  fromAddress_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromAddress_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  fromAddress_starts_with?: InputMaybe<Scalars['String']['input']>;
  isCex?: InputMaybe<Scalars['Boolean']['input']>;
  isCex_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isCex_not?: InputMaybe<Scalars['Boolean']['input']>;
  isCex_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isDex?: InputMaybe<Scalars['Boolean']['input']>;
  isDex_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isDex_not?: InputMaybe<Scalars['Boolean']['input']>;
  isDex_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isLending?: InputMaybe<Scalars['Boolean']['input']>;
  isLending_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isLending_not?: InputMaybe<Scalars['Boolean']['input']>;
  isLending_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isTotal?: InputMaybe<Scalars['Boolean']['input']>;
  isTotal_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isTotal_not?: InputMaybe<Scalars['Boolean']['input']>;
  isTotal_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  toAddress?: InputMaybe<Scalars['String']['input']>;
  toAddress_contains?: InputMaybe<Scalars['String']['input']>;
  toAddress_ends_with?: InputMaybe<Scalars['String']['input']>;
  toAddress_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  toAddress_not?: InputMaybe<Scalars['String']['input']>;
  toAddress_not_contains?: InputMaybe<Scalars['String']['input']>;
  toAddress_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  toAddress_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  toAddress_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  toAddress_starts_with?: InputMaybe<Scalars['String']['input']>;
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

export type TransactionPage = {
  __typename?: 'transactionPage';
  items: Array<Transaction>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type Transactions_200_Response = {
  __typename?: 'transactions_200_response';
  total: Scalars['Float']['output'];
  transactions: Array<Maybe<Query_Transactions_Transactions_Items>>;
};

export type Transfer = {
  __typename?: 'transfer';
  amount?: Maybe<Scalars['BigInt']['output']>;
  daoId: Scalars['String']['output'];
  from?: Maybe<Account>;
  fromAccountId: Scalars['String']['output'];
  isCex: Scalars['Boolean']['output'];
  isDex: Scalars['Boolean']['output'];
  isLending: Scalars['Boolean']['output'];
  isTotal: Scalars['Boolean']['output'];
  logIndex: Scalars['Int']['output'];
  timestamp?: Maybe<Scalars['BigInt']['output']>;
  to?: Maybe<Account>;
  toAccountId: Scalars['String']['output'];
  token?: Maybe<Token>;
  tokenId?: Maybe<Scalars['String']['output']>;
  transaction?: Maybe<Transaction>;
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
  isCex?: InputMaybe<Scalars['Boolean']['input']>;
  isCex_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isCex_not?: InputMaybe<Scalars['Boolean']['input']>;
  isCex_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isDex?: InputMaybe<Scalars['Boolean']['input']>;
  isDex_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isDex_not?: InputMaybe<Scalars['Boolean']['input']>;
  isDex_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isLending?: InputMaybe<Scalars['Boolean']['input']>;
  isLending_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isLending_not?: InputMaybe<Scalars['Boolean']['input']>;
  isLending_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isTotal?: InputMaybe<Scalars['Boolean']['input']>;
  isTotal_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  isTotal_not?: InputMaybe<Scalars['Boolean']['input']>;
  isTotal_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  logIndex?: InputMaybe<Scalars['Int']['input']>;
  logIndex_gt?: InputMaybe<Scalars['Int']['input']>;
  logIndex_gte?: InputMaybe<Scalars['Int']['input']>;
  logIndex_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  logIndex_lt?: InputMaybe<Scalars['Int']['input']>;
  logIndex_lte?: InputMaybe<Scalars['Int']['input']>;
  logIndex_not?: InputMaybe<Scalars['Int']['input']>;
  logIndex_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
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
  voterAccountId: Scalars['String']['output'];
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
  accountId: Scalars['String']['output'];
  daoId: Scalars['String']['output'];
  delegation?: Maybe<Delegation>;
  delta: Scalars['BigInt']['output'];
  logIndex: Scalars['Int']['output'];
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
  logIndex?: InputMaybe<Scalars['Int']['input']>;
  logIndex_gt?: InputMaybe<Scalars['Int']['input']>;
  logIndex_gte?: InputMaybe<Scalars['Int']['input']>;
  logIndex_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  logIndex_lt?: InputMaybe<Scalars['Int']['input']>;
  logIndex_lte?: InputMaybe<Scalars['Int']['input']>;
  logIndex_not?: InputMaybe<Scalars['Int']['input']>;
  logIndex_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
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


export type BalanceHistoryQuery = { __typename?: 'Query', transfers: { __typename?: 'transferPage', items: Array<{ __typename?: 'transfer', timestamp?: any | null, amount?: any | null, fromAccountId: string, toAccountId: string, transactionHash: string }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

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


export type BalanceHistoryBuyQuery = { __typename?: 'Query', transfers: { __typename?: 'transferPage', items: Array<{ __typename?: 'transfer', timestamp?: any | null, amount?: any | null, fromAccountId: string, toAccountId: string, transactionHash: string }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

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


export type BalanceHistorySellQuery = { __typename?: 'Query', transfers: { __typename?: 'transferPage', items: Array<{ __typename?: 'transfer', timestamp?: any | null, amount?: any | null, fromAccountId: string, toAccountId: string, transactionHash: string }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

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


export type GetDelegationsTimestampQuery = { __typename?: 'Query', delegations: { __typename?: 'delegationPage', items: Array<{ __typename?: 'delegation', delegatorAccountId: string, timestamp: any }> } };

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


export type GetDelegateDelegationHistoryQuery = { __typename?: 'Query', votingPowerHistorys: { __typename?: 'votingPowerHistoryPage', totalCount: number, items: Array<{ __typename?: 'votingPowerHistory', delta: any, transactionHash: string, timestamp: any, votingPower: any, delegation?: { __typename?: 'delegation', delegatorAccountId: string, delegatedValue: any, previousDelegate?: string | null, delegateAccountId: string } | null, transfer?: { __typename?: 'transfer', amount?: any | null, fromAccountId: string, toAccountId: string } | null }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type GetDelegateDelegationHistoryGraphQueryVariables = Exact<{
  accountId: Scalars['String']['input'];
  fromTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  toTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetDelegateDelegationHistoryGraphQuery = { __typename?: 'Query', votingPowerHistorys: { __typename?: 'votingPowerHistoryPage', totalCount: number, items: Array<{ __typename?: 'votingPowerHistory', delta: any, transactionHash: string, timestamp: any, votingPower: any, delegation?: { __typename?: 'delegation', delegatorAccountId: string, delegatedValue: any, previousDelegate?: string | null, delegateAccountId: string } | null, transfer?: { __typename?: 'transfer', amount?: any | null, fromAccountId: string, toAccountId: string } | null }> } };

export type GetDelegatesQueryVariables = Exact<{
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  addresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
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


export type GetDelegationHistoryItemsQuery = { __typename?: 'Query', delegations: { __typename?: 'delegationPage', items: Array<{ __typename?: 'delegation', timestamp: any, delegate?: { __typename?: 'account', id: string, powers?: { __typename?: 'accountPowerPage', items: Array<{ __typename?: 'accountPower', votingPower: any }> } | null } | null }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

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
  addresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
}>;


export type GetTopTokenHoldersQuery = { __typename?: 'Query', accountBalances: { __typename?: 'accountBalancePage', items: Array<{ __typename?: 'accountBalance', accountId: string, balance: any, delegate: string, tokenId: string }>, pageInfo: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null } } };

export type GetTokenHoldersCoutingQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTokenHoldersCoutingQuery = { __typename?: 'Query', accountBalances: { __typename?: 'accountBalancePage', totalCount: number } };

export type TransactionsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['PositiveInt']['input']>;
  offset?: InputMaybe<Scalars['NonNegativeInt']['input']>;
}>;


export type TransactionsQuery = { __typename?: 'Query', transactions?: { __typename?: 'transactions_200_response', total: number, transactions: Array<{ __typename?: 'query_transactions_transactions_items', from?: string | null, isCex: boolean, isDex: boolean, isLending: boolean, isTotal: boolean, timestamp: string, to?: string | null, transactionHash: string, delegations: Array<{ __typename?: 'query_transactions_transactions_items_delegations_items', daoId: string, delegateAccountId: string, delegatedValue: string, delegatorAccountId: string, isCex: boolean, isDex: boolean, isTotal: boolean, isLending: boolean, logIndex: number, previousDelegate?: string | null, timestamp: string, transactionHash: string } | null>, transfers: Array<{ __typename?: 'query_transactions_transactions_items_transfers_items', amount: string, daoId: string, fromAccountId: string, isCex: boolean, isDex: boolean, isLending: boolean, isTotal: boolean, logIndex: number, timestamp: string, toAccountId: string, tokenId: string, transactionHash: string } | null> } | null> } | null };


export const BalanceHistoryDocument = gql`
    query BalanceHistory($account: String!, $after: String, $before: String, $limit: Int = 10, $orderBy: String = "timestamp", $orderDirection: String = "desc") {
  transfers(
    where: {OR: [{fromAccountId: $account}, {toAccountId: $account}]}
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      timestamp
      amount
      fromAccountId
      toAccountId
      transactionHash
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
  }
}
    `;

/**
 * __useBalanceHistoryQuery__
 *
 * To run a query within a React component, call `useBalanceHistoryQuery` and pass it any options that fit your needs.
 * When your component renders, `useBalanceHistoryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBalanceHistoryQuery({
 *   variables: {
 *      account: // value for 'account'
 *      after: // value for 'after'
 *      before: // value for 'before'
 *      limit: // value for 'limit'
 *      orderBy: // value for 'orderBy'
 *      orderDirection: // value for 'orderDirection'
 *   },
 * });
 */
export function useBalanceHistoryQuery(baseOptions: Apollo.QueryHookOptions<BalanceHistoryQuery, BalanceHistoryQueryVariables> & ({ variables: BalanceHistoryQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BalanceHistoryQuery, BalanceHistoryQueryVariables>(BalanceHistoryDocument, options);
      }
export function useBalanceHistoryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BalanceHistoryQuery, BalanceHistoryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BalanceHistoryQuery, BalanceHistoryQueryVariables>(BalanceHistoryDocument, options);
        }
export function useBalanceHistorySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BalanceHistoryQuery, BalanceHistoryQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BalanceHistoryQuery, BalanceHistoryQueryVariables>(BalanceHistoryDocument, options);
        }
export type BalanceHistoryQueryHookResult = ReturnType<typeof useBalanceHistoryQuery>;
export type BalanceHistoryLazyQueryHookResult = ReturnType<typeof useBalanceHistoryLazyQuery>;
export type BalanceHistorySuspenseQueryHookResult = ReturnType<typeof useBalanceHistorySuspenseQuery>;
export type BalanceHistoryQueryResult = Apollo.QueryResult<BalanceHistoryQuery, BalanceHistoryQueryVariables>;
export const BalanceHistoryTotalCountDocument = gql`
    query BalanceHistoryTotalCount($account: String!) {
  transfers(where: {OR: [{fromAccountId: $account}, {toAccountId: $account}]}) {
    totalCount
  }
}
    `;

/**
 * __useBalanceHistoryTotalCountQuery__
 *
 * To run a query within a React component, call `useBalanceHistoryTotalCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useBalanceHistoryTotalCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBalanceHistoryTotalCountQuery({
 *   variables: {
 *      account: // value for 'account'
 *   },
 * });
 */
export function useBalanceHistoryTotalCountQuery(baseOptions: Apollo.QueryHookOptions<BalanceHistoryTotalCountQuery, BalanceHistoryTotalCountQueryVariables> & ({ variables: BalanceHistoryTotalCountQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BalanceHistoryTotalCountQuery, BalanceHistoryTotalCountQueryVariables>(BalanceHistoryTotalCountDocument, options);
      }
export function useBalanceHistoryTotalCountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BalanceHistoryTotalCountQuery, BalanceHistoryTotalCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BalanceHistoryTotalCountQuery, BalanceHistoryTotalCountQueryVariables>(BalanceHistoryTotalCountDocument, options);
        }
export function useBalanceHistoryTotalCountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BalanceHistoryTotalCountQuery, BalanceHistoryTotalCountQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BalanceHistoryTotalCountQuery, BalanceHistoryTotalCountQueryVariables>(BalanceHistoryTotalCountDocument, options);
        }
export type BalanceHistoryTotalCountQueryHookResult = ReturnType<typeof useBalanceHistoryTotalCountQuery>;
export type BalanceHistoryTotalCountLazyQueryHookResult = ReturnType<typeof useBalanceHistoryTotalCountLazyQuery>;
export type BalanceHistoryTotalCountSuspenseQueryHookResult = ReturnType<typeof useBalanceHistoryTotalCountSuspenseQuery>;
export type BalanceHistoryTotalCountQueryResult = Apollo.QueryResult<BalanceHistoryTotalCountQuery, BalanceHistoryTotalCountQueryVariables>;
export const BalanceHistoryBuyDocument = gql`
    query BalanceHistoryBuy($account: String!, $after: String, $before: String, $limit: Int = 10, $orderBy: String = "timestamp", $orderDirection: String = "desc") {
  transfers(
    where: {toAccountId: $account}
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      timestamp
      amount
      fromAccountId
      toAccountId
      transactionHash
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
  }
}
    `;

/**
 * __useBalanceHistoryBuyQuery__
 *
 * To run a query within a React component, call `useBalanceHistoryBuyQuery` and pass it any options that fit your needs.
 * When your component renders, `useBalanceHistoryBuyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBalanceHistoryBuyQuery({
 *   variables: {
 *      account: // value for 'account'
 *      after: // value for 'after'
 *      before: // value for 'before'
 *      limit: // value for 'limit'
 *      orderBy: // value for 'orderBy'
 *      orderDirection: // value for 'orderDirection'
 *   },
 * });
 */
export function useBalanceHistoryBuyQuery(baseOptions: Apollo.QueryHookOptions<BalanceHistoryBuyQuery, BalanceHistoryBuyQueryVariables> & ({ variables: BalanceHistoryBuyQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BalanceHistoryBuyQuery, BalanceHistoryBuyQueryVariables>(BalanceHistoryBuyDocument, options);
      }
export function useBalanceHistoryBuyLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BalanceHistoryBuyQuery, BalanceHistoryBuyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BalanceHistoryBuyQuery, BalanceHistoryBuyQueryVariables>(BalanceHistoryBuyDocument, options);
        }
export function useBalanceHistoryBuySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BalanceHistoryBuyQuery, BalanceHistoryBuyQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BalanceHistoryBuyQuery, BalanceHistoryBuyQueryVariables>(BalanceHistoryBuyDocument, options);
        }
export type BalanceHistoryBuyQueryHookResult = ReturnType<typeof useBalanceHistoryBuyQuery>;
export type BalanceHistoryBuyLazyQueryHookResult = ReturnType<typeof useBalanceHistoryBuyLazyQuery>;
export type BalanceHistoryBuySuspenseQueryHookResult = ReturnType<typeof useBalanceHistoryBuySuspenseQuery>;
export type BalanceHistoryBuyQueryResult = Apollo.QueryResult<BalanceHistoryBuyQuery, BalanceHistoryBuyQueryVariables>;
export const BalanceHistoryBuyTotalCountDocument = gql`
    query BalanceHistoryBuyTotalCount($account: String!) {
  transfers(where: {toAccountId: $account}) {
    totalCount
  }
}
    `;

/**
 * __useBalanceHistoryBuyTotalCountQuery__
 *
 * To run a query within a React component, call `useBalanceHistoryBuyTotalCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useBalanceHistoryBuyTotalCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBalanceHistoryBuyTotalCountQuery({
 *   variables: {
 *      account: // value for 'account'
 *   },
 * });
 */
export function useBalanceHistoryBuyTotalCountQuery(baseOptions: Apollo.QueryHookOptions<BalanceHistoryBuyTotalCountQuery, BalanceHistoryBuyTotalCountQueryVariables> & ({ variables: BalanceHistoryBuyTotalCountQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BalanceHistoryBuyTotalCountQuery, BalanceHistoryBuyTotalCountQueryVariables>(BalanceHistoryBuyTotalCountDocument, options);
      }
export function useBalanceHistoryBuyTotalCountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BalanceHistoryBuyTotalCountQuery, BalanceHistoryBuyTotalCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BalanceHistoryBuyTotalCountQuery, BalanceHistoryBuyTotalCountQueryVariables>(BalanceHistoryBuyTotalCountDocument, options);
        }
export function useBalanceHistoryBuyTotalCountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BalanceHistoryBuyTotalCountQuery, BalanceHistoryBuyTotalCountQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BalanceHistoryBuyTotalCountQuery, BalanceHistoryBuyTotalCountQueryVariables>(BalanceHistoryBuyTotalCountDocument, options);
        }
export type BalanceHistoryBuyTotalCountQueryHookResult = ReturnType<typeof useBalanceHistoryBuyTotalCountQuery>;
export type BalanceHistoryBuyTotalCountLazyQueryHookResult = ReturnType<typeof useBalanceHistoryBuyTotalCountLazyQuery>;
export type BalanceHistoryBuyTotalCountSuspenseQueryHookResult = ReturnType<typeof useBalanceHistoryBuyTotalCountSuspenseQuery>;
export type BalanceHistoryBuyTotalCountQueryResult = Apollo.QueryResult<BalanceHistoryBuyTotalCountQuery, BalanceHistoryBuyTotalCountQueryVariables>;
export const BalanceHistorySellDocument = gql`
    query BalanceHistorySell($account: String!, $after: String, $before: String, $limit: Int = 10, $orderBy: String = "timestamp", $orderDirection: String = "desc") {
  transfers(
    where: {fromAccountId: $account}
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      timestamp
      amount
      fromAccountId
      toAccountId
      transactionHash
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
  }
}
    `;

/**
 * __useBalanceHistorySellQuery__
 *
 * To run a query within a React component, call `useBalanceHistorySellQuery` and pass it any options that fit your needs.
 * When your component renders, `useBalanceHistorySellQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBalanceHistorySellQuery({
 *   variables: {
 *      account: // value for 'account'
 *      after: // value for 'after'
 *      before: // value for 'before'
 *      limit: // value for 'limit'
 *      orderBy: // value for 'orderBy'
 *      orderDirection: // value for 'orderDirection'
 *   },
 * });
 */
export function useBalanceHistorySellQuery(baseOptions: Apollo.QueryHookOptions<BalanceHistorySellQuery, BalanceHistorySellQueryVariables> & ({ variables: BalanceHistorySellQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BalanceHistorySellQuery, BalanceHistorySellQueryVariables>(BalanceHistorySellDocument, options);
      }
export function useBalanceHistorySellLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BalanceHistorySellQuery, BalanceHistorySellQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BalanceHistorySellQuery, BalanceHistorySellQueryVariables>(BalanceHistorySellDocument, options);
        }
export function useBalanceHistorySellSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BalanceHistorySellQuery, BalanceHistorySellQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BalanceHistorySellQuery, BalanceHistorySellQueryVariables>(BalanceHistorySellDocument, options);
        }
export type BalanceHistorySellQueryHookResult = ReturnType<typeof useBalanceHistorySellQuery>;
export type BalanceHistorySellLazyQueryHookResult = ReturnType<typeof useBalanceHistorySellLazyQuery>;
export type BalanceHistorySellSuspenseQueryHookResult = ReturnType<typeof useBalanceHistorySellSuspenseQuery>;
export type BalanceHistorySellQueryResult = Apollo.QueryResult<BalanceHistorySellQuery, BalanceHistorySellQueryVariables>;
export const BalanceHistorySellTotalCountDocument = gql`
    query BalanceHistorySellTotalCount($account: String!) {
  transfers(where: {fromAccountId: $account}) {
    totalCount
  }
}
    `;

/**
 * __useBalanceHistorySellTotalCountQuery__
 *
 * To run a query within a React component, call `useBalanceHistorySellTotalCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useBalanceHistorySellTotalCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBalanceHistorySellTotalCountQuery({
 *   variables: {
 *      account: // value for 'account'
 *   },
 * });
 */
export function useBalanceHistorySellTotalCountQuery(baseOptions: Apollo.QueryHookOptions<BalanceHistorySellTotalCountQuery, BalanceHistorySellTotalCountQueryVariables> & ({ variables: BalanceHistorySellTotalCountQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BalanceHistorySellTotalCountQuery, BalanceHistorySellTotalCountQueryVariables>(BalanceHistorySellTotalCountDocument, options);
      }
export function useBalanceHistorySellTotalCountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BalanceHistorySellTotalCountQuery, BalanceHistorySellTotalCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BalanceHistorySellTotalCountQuery, BalanceHistorySellTotalCountQueryVariables>(BalanceHistorySellTotalCountDocument, options);
        }
export function useBalanceHistorySellTotalCountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BalanceHistorySellTotalCountQuery, BalanceHistorySellTotalCountQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BalanceHistorySellTotalCountQuery, BalanceHistorySellTotalCountQueryVariables>(BalanceHistorySellTotalCountDocument, options);
        }
export type BalanceHistorySellTotalCountQueryHookResult = ReturnType<typeof useBalanceHistorySellTotalCountQuery>;
export type BalanceHistorySellTotalCountLazyQueryHookResult = ReturnType<typeof useBalanceHistorySellTotalCountLazyQuery>;
export type BalanceHistorySellTotalCountSuspenseQueryHookResult = ReturnType<typeof useBalanceHistorySellTotalCountSuspenseQuery>;
export type BalanceHistorySellTotalCountQueryResult = Apollo.QueryResult<BalanceHistorySellTotalCountQuery, BalanceHistorySellTotalCountQueryVariables>;
export const GetDaoDataDocument = gql`
    query GetDaoData($daoId: String!) {
  dao(id: $daoId) {
    id
    quorum
    proposalThreshold
    votingDelay
    votingPeriod
    timelockDelay
  }
}
    `;

/**
 * __useGetDaoDataQuery__
 *
 * To run a query within a React component, call `useGetDaoDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDaoDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDaoDataQuery({
 *   variables: {
 *      daoId: // value for 'daoId'
 *   },
 * });
 */
export function useGetDaoDataQuery(baseOptions: Apollo.QueryHookOptions<GetDaoDataQuery, GetDaoDataQueryVariables> & ({ variables: GetDaoDataQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDaoDataQuery, GetDaoDataQueryVariables>(GetDaoDataDocument, options);
      }
export function useGetDaoDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDaoDataQuery, GetDaoDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDaoDataQuery, GetDaoDataQueryVariables>(GetDaoDataDocument, options);
        }
export function useGetDaoDataSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDaoDataQuery, GetDaoDataQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDaoDataQuery, GetDaoDataQueryVariables>(GetDaoDataDocument, options);
        }
export type GetDaoDataQueryHookResult = ReturnType<typeof useGetDaoDataQuery>;
export type GetDaoDataLazyQueryHookResult = ReturnType<typeof useGetDaoDataLazyQuery>;
export type GetDaoDataSuspenseQueryHookResult = ReturnType<typeof useGetDaoDataSuspenseQuery>;
export type GetDaoDataQueryResult = Apollo.QueryResult<GetDaoDataQuery, GetDaoDataQueryVariables>;
export const GetDelegatorVotingPowerDetailsDocument = gql`
    query GetDelegatorVotingPowerDetails($address: String!, $after: String, $before: String, $orderBy: String, $orderDirection: String, $limit: Int) {
  accountPower(accountId: $address) {
    votingPower
    accountId
  }
  accountBalances(
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
    where: {delegate: $address}
  ) {
    items {
      accountId
      balance
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useGetDelegatorVotingPowerDetailsQuery__
 *
 * To run a query within a React component, call `useGetDelegatorVotingPowerDetailsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDelegatorVotingPowerDetailsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDelegatorVotingPowerDetailsQuery({
 *   variables: {
 *      address: // value for 'address'
 *      after: // value for 'after'
 *      before: // value for 'before'
 *      orderBy: // value for 'orderBy'
 *      orderDirection: // value for 'orderDirection'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetDelegatorVotingPowerDetailsQuery(baseOptions: Apollo.QueryHookOptions<GetDelegatorVotingPowerDetailsQuery, GetDelegatorVotingPowerDetailsQueryVariables> & ({ variables: GetDelegatorVotingPowerDetailsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDelegatorVotingPowerDetailsQuery, GetDelegatorVotingPowerDetailsQueryVariables>(GetDelegatorVotingPowerDetailsDocument, options);
      }
export function useGetDelegatorVotingPowerDetailsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDelegatorVotingPowerDetailsQuery, GetDelegatorVotingPowerDetailsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDelegatorVotingPowerDetailsQuery, GetDelegatorVotingPowerDetailsQueryVariables>(GetDelegatorVotingPowerDetailsDocument, options);
        }
export function useGetDelegatorVotingPowerDetailsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDelegatorVotingPowerDetailsQuery, GetDelegatorVotingPowerDetailsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDelegatorVotingPowerDetailsQuery, GetDelegatorVotingPowerDetailsQueryVariables>(GetDelegatorVotingPowerDetailsDocument, options);
        }
export type GetDelegatorVotingPowerDetailsQueryHookResult = ReturnType<typeof useGetDelegatorVotingPowerDetailsQuery>;
export type GetDelegatorVotingPowerDetailsLazyQueryHookResult = ReturnType<typeof useGetDelegatorVotingPowerDetailsLazyQuery>;
export type GetDelegatorVotingPowerDetailsSuspenseQueryHookResult = ReturnType<typeof useGetDelegatorVotingPowerDetailsSuspenseQuery>;
export type GetDelegatorVotingPowerDetailsQueryResult = Apollo.QueryResult<GetDelegatorVotingPowerDetailsQuery, GetDelegatorVotingPowerDetailsQueryVariables>;
export const GetDelegationsTimestampDocument = gql`
    query getDelegationsTimestamp($delegator: [String!]!, $delegate: String!, $daoId: String!) {
  delegations(
    where: {daoId: $daoId, delegatorAccountId_in: $delegator, delegateAccountId: $delegate}
  ) {
    items {
      delegatorAccountId
      timestamp
    }
  }
}
    `;

/**
 * __useGetDelegationsTimestampQuery__
 *
 * To run a query within a React component, call `useGetDelegationsTimestampQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDelegationsTimestampQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDelegationsTimestampQuery({
 *   variables: {
 *      delegator: // value for 'delegator'
 *      delegate: // value for 'delegate'
 *      daoId: // value for 'daoId'
 *   },
 * });
 */
export function useGetDelegationsTimestampQuery(baseOptions: Apollo.QueryHookOptions<GetDelegationsTimestampQuery, GetDelegationsTimestampQueryVariables> & ({ variables: GetDelegationsTimestampQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDelegationsTimestampQuery, GetDelegationsTimestampQueryVariables>(GetDelegationsTimestampDocument, options);
      }
export function useGetDelegationsTimestampLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDelegationsTimestampQuery, GetDelegationsTimestampQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDelegationsTimestampQuery, GetDelegationsTimestampQueryVariables>(GetDelegationsTimestampDocument, options);
        }
export function useGetDelegationsTimestampSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDelegationsTimestampQuery, GetDelegationsTimestampQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDelegationsTimestampQuery, GetDelegationsTimestampQueryVariables>(GetDelegationsTimestampDocument, options);
        }
export type GetDelegationsTimestampQueryHookResult = ReturnType<typeof useGetDelegationsTimestampQuery>;
export type GetDelegationsTimestampLazyQueryHookResult = ReturnType<typeof useGetDelegationsTimestampLazyQuery>;
export type GetDelegationsTimestampSuspenseQueryHookResult = ReturnType<typeof useGetDelegationsTimestampSuspenseQuery>;
export type GetDelegationsTimestampQueryResult = Apollo.QueryResult<GetDelegationsTimestampQuery, GetDelegationsTimestampQueryVariables>;
export const GetTopFiveDelegatorsDocument = gql`
    query GetTopFiveDelegators($delegate: String!, $limit: Int = 5) {
  accountBalances(
    where: {delegate: $delegate, balance_gt: 0}
    orderBy: "balance"
    orderDirection: "desc"
    limit: $limit
  ) {
    items {
      accountId
      balance
    }
  }
}
    `;

/**
 * __useGetTopFiveDelegatorsQuery__
 *
 * To run a query within a React component, call `useGetTopFiveDelegatorsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTopFiveDelegatorsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTopFiveDelegatorsQuery({
 *   variables: {
 *      delegate: // value for 'delegate'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetTopFiveDelegatorsQuery(baseOptions: Apollo.QueryHookOptions<GetTopFiveDelegatorsQuery, GetTopFiveDelegatorsQueryVariables> & ({ variables: GetTopFiveDelegatorsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTopFiveDelegatorsQuery, GetTopFiveDelegatorsQueryVariables>(GetTopFiveDelegatorsDocument, options);
      }
export function useGetTopFiveDelegatorsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTopFiveDelegatorsQuery, GetTopFiveDelegatorsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTopFiveDelegatorsQuery, GetTopFiveDelegatorsQueryVariables>(GetTopFiveDelegatorsDocument, options);
        }
export function useGetTopFiveDelegatorsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTopFiveDelegatorsQuery, GetTopFiveDelegatorsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetTopFiveDelegatorsQuery, GetTopFiveDelegatorsQueryVariables>(GetTopFiveDelegatorsDocument, options);
        }
export type GetTopFiveDelegatorsQueryHookResult = ReturnType<typeof useGetTopFiveDelegatorsQuery>;
export type GetTopFiveDelegatorsLazyQueryHookResult = ReturnType<typeof useGetTopFiveDelegatorsLazyQuery>;
export type GetTopFiveDelegatorsSuspenseQueryHookResult = ReturnType<typeof useGetTopFiveDelegatorsSuspenseQuery>;
export type GetTopFiveDelegatorsQueryResult = Apollo.QueryResult<GetTopFiveDelegatorsQuery, GetTopFiveDelegatorsQueryVariables>;
export const GetVotingPowerCountingDocument = gql`
    query GetVotingPowerCounting($address: String!) {
  accountBalances(where: {delegate: $address}) {
    totalCount
  }
}
    `;

/**
 * __useGetVotingPowerCountingQuery__
 *
 * To run a query within a React component, call `useGetVotingPowerCountingQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetVotingPowerCountingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetVotingPowerCountingQuery({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function useGetVotingPowerCountingQuery(baseOptions: Apollo.QueryHookOptions<GetVotingPowerCountingQuery, GetVotingPowerCountingQueryVariables> & ({ variables: GetVotingPowerCountingQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetVotingPowerCountingQuery, GetVotingPowerCountingQueryVariables>(GetVotingPowerCountingDocument, options);
      }
export function useGetVotingPowerCountingLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetVotingPowerCountingQuery, GetVotingPowerCountingQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetVotingPowerCountingQuery, GetVotingPowerCountingQueryVariables>(GetVotingPowerCountingDocument, options);
        }
export function useGetVotingPowerCountingSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetVotingPowerCountingQuery, GetVotingPowerCountingQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetVotingPowerCountingQuery, GetVotingPowerCountingQueryVariables>(GetVotingPowerCountingDocument, options);
        }
export type GetVotingPowerCountingQueryHookResult = ReturnType<typeof useGetVotingPowerCountingQuery>;
export type GetVotingPowerCountingLazyQueryHookResult = ReturnType<typeof useGetVotingPowerCountingLazyQuery>;
export type GetVotingPowerCountingSuspenseQueryHookResult = ReturnType<typeof useGetVotingPowerCountingSuspenseQuery>;
export type GetVotingPowerCountingQueryResult = Apollo.QueryResult<GetVotingPowerCountingQuery, GetVotingPowerCountingQueryVariables>;
export const GetDelegateDelegationHistoryDocument = gql`
    query GetDelegateDelegationHistory($accountId: String!, $orderBy: String = "timestamp", $orderDirection: String = "desc", $limit: Int = 10, $after: String, $before: String) {
  votingPowerHistorys(
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: {accountId: $accountId}
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      delta
      transactionHash
      timestamp
      delegation {
        delegatorAccountId
        delegatedValue
        previousDelegate
        delegateAccountId
      }
      transfer {
        amount
        fromAccountId
        toAccountId
      }
      votingPower
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;

/**
 * __useGetDelegateDelegationHistoryQuery__
 *
 * To run a query within a React component, call `useGetDelegateDelegationHistoryQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDelegateDelegationHistoryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDelegateDelegationHistoryQuery({
 *   variables: {
 *      accountId: // value for 'accountId'
 *      orderBy: // value for 'orderBy'
 *      orderDirection: // value for 'orderDirection'
 *      limit: // value for 'limit'
 *      after: // value for 'after'
 *      before: // value for 'before'
 *   },
 * });
 */
export function useGetDelegateDelegationHistoryQuery(baseOptions: Apollo.QueryHookOptions<GetDelegateDelegationHistoryQuery, GetDelegateDelegationHistoryQueryVariables> & ({ variables: GetDelegateDelegationHistoryQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDelegateDelegationHistoryQuery, GetDelegateDelegationHistoryQueryVariables>(GetDelegateDelegationHistoryDocument, options);
      }
export function useGetDelegateDelegationHistoryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDelegateDelegationHistoryQuery, GetDelegateDelegationHistoryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDelegateDelegationHistoryQuery, GetDelegateDelegationHistoryQueryVariables>(GetDelegateDelegationHistoryDocument, options);
        }
export function useGetDelegateDelegationHistorySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDelegateDelegationHistoryQuery, GetDelegateDelegationHistoryQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDelegateDelegationHistoryQuery, GetDelegateDelegationHistoryQueryVariables>(GetDelegateDelegationHistoryDocument, options);
        }
export type GetDelegateDelegationHistoryQueryHookResult = ReturnType<typeof useGetDelegateDelegationHistoryQuery>;
export type GetDelegateDelegationHistoryLazyQueryHookResult = ReturnType<typeof useGetDelegateDelegationHistoryLazyQuery>;
export type GetDelegateDelegationHistorySuspenseQueryHookResult = ReturnType<typeof useGetDelegateDelegationHistorySuspenseQuery>;
export type GetDelegateDelegationHistoryQueryResult = Apollo.QueryResult<GetDelegateDelegationHistoryQuery, GetDelegateDelegationHistoryQueryVariables>;
export const GetDelegateDelegationHistoryGraphDocument = gql`
    query GetDelegateDelegationHistoryGraph($accountId: String!, $fromTimestamp: BigInt, $toTimestamp: BigInt, $orderBy: String = "timestamp", $orderDirection: String = "desc") {
  votingPowerHistorys(
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: {accountId: $accountId, timestamp_gte: $fromTimestamp, timestamp_lte: $toTimestamp}
    limit: 1000
  ) {
    items {
      delta
      transactionHash
      timestamp
      delegation {
        delegatorAccountId
        delegatedValue
        previousDelegate
        delegateAccountId
      }
      transfer {
        amount
        fromAccountId
        toAccountId
      }
      votingPower
    }
    totalCount
  }
}
    `;

/**
 * __useGetDelegateDelegationHistoryGraphQuery__
 *
 * To run a query within a React component, call `useGetDelegateDelegationHistoryGraphQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDelegateDelegationHistoryGraphQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDelegateDelegationHistoryGraphQuery({
 *   variables: {
 *      accountId: // value for 'accountId'
 *      fromTimestamp: // value for 'fromTimestamp'
 *      toTimestamp: // value for 'toTimestamp'
 *      orderBy: // value for 'orderBy'
 *      orderDirection: // value for 'orderDirection'
 *   },
 * });
 */
export function useGetDelegateDelegationHistoryGraphQuery(baseOptions: Apollo.QueryHookOptions<GetDelegateDelegationHistoryGraphQuery, GetDelegateDelegationHistoryGraphQueryVariables> & ({ variables: GetDelegateDelegationHistoryGraphQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDelegateDelegationHistoryGraphQuery, GetDelegateDelegationHistoryGraphQueryVariables>(GetDelegateDelegationHistoryGraphDocument, options);
      }
export function useGetDelegateDelegationHistoryGraphLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDelegateDelegationHistoryGraphQuery, GetDelegateDelegationHistoryGraphQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDelegateDelegationHistoryGraphQuery, GetDelegateDelegationHistoryGraphQueryVariables>(GetDelegateDelegationHistoryGraphDocument, options);
        }
export function useGetDelegateDelegationHistoryGraphSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDelegateDelegationHistoryGraphQuery, GetDelegateDelegationHistoryGraphQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDelegateDelegationHistoryGraphQuery, GetDelegateDelegationHistoryGraphQueryVariables>(GetDelegateDelegationHistoryGraphDocument, options);
        }
export type GetDelegateDelegationHistoryGraphQueryHookResult = ReturnType<typeof useGetDelegateDelegationHistoryGraphQuery>;
export type GetDelegateDelegationHistoryGraphLazyQueryHookResult = ReturnType<typeof useGetDelegateDelegationHistoryGraphLazyQuery>;
export type GetDelegateDelegationHistoryGraphSuspenseQueryHookResult = ReturnType<typeof useGetDelegateDelegationHistoryGraphSuspenseQuery>;
export type GetDelegateDelegationHistoryGraphQueryResult = Apollo.QueryResult<GetDelegateDelegationHistoryGraphQuery, GetDelegateDelegationHistoryGraphQueryVariables>;
export const GetDelegatesDocument = gql`
    query GetDelegates($after: String, $before: String, $orderBy: String = "votingPower", $orderDirection: String = "desc", $addresses: [String]) {
  accountPowers(
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: 10
    after: $after
    before: $before
    where: {votingPower_gt: 0, accountId_in: $addresses}
  ) {
    items {
      votingPower
      accountId
      delegationsCount
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
  }
}
    `;

/**
 * __useGetDelegatesQuery__
 *
 * To run a query within a React component, call `useGetDelegatesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDelegatesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDelegatesQuery({
 *   variables: {
 *      after: // value for 'after'
 *      before: // value for 'before'
 *      orderBy: // value for 'orderBy'
 *      orderDirection: // value for 'orderDirection'
 *      addresses: // value for 'addresses'
 *   },
 * });
 */
export function useGetDelegatesQuery(baseOptions?: Apollo.QueryHookOptions<GetDelegatesQuery, GetDelegatesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDelegatesQuery, GetDelegatesQueryVariables>(GetDelegatesDocument, options);
      }
export function useGetDelegatesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDelegatesQuery, GetDelegatesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDelegatesQuery, GetDelegatesQueryVariables>(GetDelegatesDocument, options);
        }
export function useGetDelegatesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDelegatesQuery, GetDelegatesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDelegatesQuery, GetDelegatesQueryVariables>(GetDelegatesDocument, options);
        }
export type GetDelegatesQueryHookResult = ReturnType<typeof useGetDelegatesQuery>;
export type GetDelegatesLazyQueryHookResult = ReturnType<typeof useGetDelegatesLazyQuery>;
export type GetDelegatesSuspenseQueryHookResult = ReturnType<typeof useGetDelegatesSuspenseQuery>;
export type GetDelegatesQueryResult = Apollo.QueryResult<GetDelegatesQuery, GetDelegatesQueryVariables>;
export const GetDelegatesCountDocument = gql`
    query GetDelegatesCount {
  accountPowers(where: {votingPower_gt: 0}) {
    totalCount
  }
}
    `;

/**
 * __useGetDelegatesCountQuery__
 *
 * To run a query within a React component, call `useGetDelegatesCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDelegatesCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDelegatesCountQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetDelegatesCountQuery(baseOptions?: Apollo.QueryHookOptions<GetDelegatesCountQuery, GetDelegatesCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDelegatesCountQuery, GetDelegatesCountQueryVariables>(GetDelegatesCountDocument, options);
      }
export function useGetDelegatesCountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDelegatesCountQuery, GetDelegatesCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDelegatesCountQuery, GetDelegatesCountQueryVariables>(GetDelegatesCountDocument, options);
        }
export function useGetDelegatesCountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDelegatesCountQuery, GetDelegatesCountQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDelegatesCountQuery, GetDelegatesCountQueryVariables>(GetDelegatesCountDocument, options);
        }
export type GetDelegatesCountQueryHookResult = ReturnType<typeof useGetDelegatesCountQuery>;
export type GetDelegatesCountLazyQueryHookResult = ReturnType<typeof useGetDelegatesCountLazyQuery>;
export type GetDelegatesCountSuspenseQueryHookResult = ReturnType<typeof useGetDelegatesCountSuspenseQuery>;
export type GetDelegatesCountQueryResult = Apollo.QueryResult<GetDelegatesCountQuery, GetDelegatesCountQueryVariables>;
export const GetDelegationHistoryCountDocument = gql`
    query GetDelegationHistoryCount($delegator: String!) {
  delegations(where: {delegatorAccountId: $delegator}) {
    totalCount
  }
}
    `;

/**
 * __useGetDelegationHistoryCountQuery__
 *
 * To run a query within a React component, call `useGetDelegationHistoryCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDelegationHistoryCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDelegationHistoryCountQuery({
 *   variables: {
 *      delegator: // value for 'delegator'
 *   },
 * });
 */
export function useGetDelegationHistoryCountQuery(baseOptions: Apollo.QueryHookOptions<GetDelegationHistoryCountQuery, GetDelegationHistoryCountQueryVariables> & ({ variables: GetDelegationHistoryCountQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDelegationHistoryCountQuery, GetDelegationHistoryCountQueryVariables>(GetDelegationHistoryCountDocument, options);
      }
export function useGetDelegationHistoryCountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDelegationHistoryCountQuery, GetDelegationHistoryCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDelegationHistoryCountQuery, GetDelegationHistoryCountQueryVariables>(GetDelegationHistoryCountDocument, options);
        }
export function useGetDelegationHistoryCountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDelegationHistoryCountQuery, GetDelegationHistoryCountQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDelegationHistoryCountQuery, GetDelegationHistoryCountQueryVariables>(GetDelegationHistoryCountDocument, options);
        }
export type GetDelegationHistoryCountQueryHookResult = ReturnType<typeof useGetDelegationHistoryCountQuery>;
export type GetDelegationHistoryCountLazyQueryHookResult = ReturnType<typeof useGetDelegationHistoryCountLazyQuery>;
export type GetDelegationHistoryCountSuspenseQueryHookResult = ReturnType<typeof useGetDelegationHistoryCountSuspenseQuery>;
export type GetDelegationHistoryCountQueryResult = Apollo.QueryResult<GetDelegationHistoryCountQuery, GetDelegationHistoryCountQueryVariables>;
export const GetDelegationHistoryItemsDocument = gql`
    query GetDelegationHistoryItems($delegator: String!, $after: String, $before: String, $orderBy: String = "timestamp", $orderDirection: String = "desc", $limit: Int = 10) {
  delegations(
    where: {delegatorAccountId: $delegator}
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      delegate {
        id
        powers {
          items {
            votingPower
          }
        }
      }
      timestamp
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useGetDelegationHistoryItemsQuery__
 *
 * To run a query within a React component, call `useGetDelegationHistoryItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDelegationHistoryItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDelegationHistoryItemsQuery({
 *   variables: {
 *      delegator: // value for 'delegator'
 *      after: // value for 'after'
 *      before: // value for 'before'
 *      orderBy: // value for 'orderBy'
 *      orderDirection: // value for 'orderDirection'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetDelegationHistoryItemsQuery(baseOptions: Apollo.QueryHookOptions<GetDelegationHistoryItemsQuery, GetDelegationHistoryItemsQueryVariables> & ({ variables: GetDelegationHistoryItemsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDelegationHistoryItemsQuery, GetDelegationHistoryItemsQueryVariables>(GetDelegationHistoryItemsDocument, options);
      }
export function useGetDelegationHistoryItemsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDelegationHistoryItemsQuery, GetDelegationHistoryItemsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDelegationHistoryItemsQuery, GetDelegationHistoryItemsQueryVariables>(GetDelegationHistoryItemsDocument, options);
        }
export function useGetDelegationHistoryItemsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDelegationHistoryItemsQuery, GetDelegationHistoryItemsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDelegationHistoryItemsQuery, GetDelegationHistoryItemsQueryVariables>(GetDelegationHistoryItemsDocument, options);
        }
export type GetDelegationHistoryItemsQueryHookResult = ReturnType<typeof useGetDelegationHistoryItemsQuery>;
export type GetDelegationHistoryItemsLazyQueryHookResult = ReturnType<typeof useGetDelegationHistoryItemsLazyQuery>;
export type GetDelegationHistoryItemsSuspenseQueryHookResult = ReturnType<typeof useGetDelegationHistoryItemsSuspenseQuery>;
export type GetDelegationHistoryItemsQueryResult = Apollo.QueryResult<GetDelegationHistoryItemsQuery, GetDelegationHistoryItemsQueryVariables>;
export const GetHistoricalVotingAndActivityDocument = gql`
    query GetHistoricalVotingAndActivity($addresses: JSON!, $address: String!, $days: queryInput_historicalVotingPower_days!, $fromDate: NonNegativeInt) {
  historicalVotingPower(addresses: $addresses, days: $days) {
    address
    votingPower
  }
  proposalsActivity(address: $address, fromDate: $fromDate) {
    totalProposals
    votedProposals
    neverVoted
  }
}
    `;

/**
 * __useGetHistoricalVotingAndActivityQuery__
 *
 * To run a query within a React component, call `useGetHistoricalVotingAndActivityQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetHistoricalVotingAndActivityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetHistoricalVotingAndActivityQuery({
 *   variables: {
 *      addresses: // value for 'addresses'
 *      address: // value for 'address'
 *      days: // value for 'days'
 *      fromDate: // value for 'fromDate'
 *   },
 * });
 */
export function useGetHistoricalVotingAndActivityQuery(baseOptions: Apollo.QueryHookOptions<GetHistoricalVotingAndActivityQuery, GetHistoricalVotingAndActivityQueryVariables> & ({ variables: GetHistoricalVotingAndActivityQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetHistoricalVotingAndActivityQuery, GetHistoricalVotingAndActivityQueryVariables>(GetHistoricalVotingAndActivityDocument, options);
      }
export function useGetHistoricalVotingAndActivityLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetHistoricalVotingAndActivityQuery, GetHistoricalVotingAndActivityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetHistoricalVotingAndActivityQuery, GetHistoricalVotingAndActivityQueryVariables>(GetHistoricalVotingAndActivityDocument, options);
        }
export function useGetHistoricalVotingAndActivitySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetHistoricalVotingAndActivityQuery, GetHistoricalVotingAndActivityQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetHistoricalVotingAndActivityQuery, GetHistoricalVotingAndActivityQueryVariables>(GetHistoricalVotingAndActivityDocument, options);
        }
export type GetHistoricalVotingAndActivityQueryHookResult = ReturnType<typeof useGetHistoricalVotingAndActivityQuery>;
export type GetHistoricalVotingAndActivityLazyQueryHookResult = ReturnType<typeof useGetHistoricalVotingAndActivityLazyQuery>;
export type GetHistoricalVotingAndActivitySuspenseQueryHookResult = ReturnType<typeof useGetHistoricalVotingAndActivitySuspenseQuery>;
export type GetHistoricalVotingAndActivityQueryResult = Apollo.QueryResult<GetHistoricalVotingAndActivityQuery, GetHistoricalVotingAndActivityQueryVariables>;
export const GetDelegateProposalsActivityDocument = gql`
    query GetDelegateProposalsActivity($address: String!, $fromDate: NonNegativeInt) {
  proposalsActivity(address: $address, fromDate: $fromDate) {
    address
    totalProposals
    votedProposals
    neverVoted
  }
}
    `;

/**
 * __useGetDelegateProposalsActivityQuery__
 *
 * To run a query within a React component, call `useGetDelegateProposalsActivityQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDelegateProposalsActivityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDelegateProposalsActivityQuery({
 *   variables: {
 *      address: // value for 'address'
 *      fromDate: // value for 'fromDate'
 *   },
 * });
 */
export function useGetDelegateProposalsActivityQuery(baseOptions: Apollo.QueryHookOptions<GetDelegateProposalsActivityQuery, GetDelegateProposalsActivityQueryVariables> & ({ variables: GetDelegateProposalsActivityQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDelegateProposalsActivityQuery, GetDelegateProposalsActivityQueryVariables>(GetDelegateProposalsActivityDocument, options);
      }
export function useGetDelegateProposalsActivityLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDelegateProposalsActivityQuery, GetDelegateProposalsActivityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDelegateProposalsActivityQuery, GetDelegateProposalsActivityQueryVariables>(GetDelegateProposalsActivityDocument, options);
        }
export function useGetDelegateProposalsActivitySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDelegateProposalsActivityQuery, GetDelegateProposalsActivityQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDelegateProposalsActivityQuery, GetDelegateProposalsActivityQueryVariables>(GetDelegateProposalsActivityDocument, options);
        }
export type GetDelegateProposalsActivityQueryHookResult = ReturnType<typeof useGetDelegateProposalsActivityQuery>;
export type GetDelegateProposalsActivityLazyQueryHookResult = ReturnType<typeof useGetDelegateProposalsActivityLazyQuery>;
export type GetDelegateProposalsActivitySuspenseQueryHookResult = ReturnType<typeof useGetDelegateProposalsActivitySuspenseQuery>;
export type GetDelegateProposalsActivityQueryResult = Apollo.QueryResult<GetDelegateProposalsActivityQuery, GetDelegateProposalsActivityQueryVariables>;
export const GetHistoricalBalancesDocument = gql`
    query getHistoricalBalances($addresses: JSON!, $days: queryInput_historicalBalances_days!) {
  historicalBalances(addresses: $addresses, days: $days) {
    address
    balance
    blockNumber
    tokenAddress
  }
}
    `;

/**
 * __useGetHistoricalBalancesQuery__
 *
 * To run a query within a React component, call `useGetHistoricalBalancesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetHistoricalBalancesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetHistoricalBalancesQuery({
 *   variables: {
 *      addresses: // value for 'addresses'
 *      days: // value for 'days'
 *   },
 * });
 */
export function useGetHistoricalBalancesQuery(baseOptions: Apollo.QueryHookOptions<GetHistoricalBalancesQuery, GetHistoricalBalancesQueryVariables> & ({ variables: GetHistoricalBalancesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetHistoricalBalancesQuery, GetHistoricalBalancesQueryVariables>(GetHistoricalBalancesDocument, options);
      }
export function useGetHistoricalBalancesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetHistoricalBalancesQuery, GetHistoricalBalancesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetHistoricalBalancesQuery, GetHistoricalBalancesQueryVariables>(GetHistoricalBalancesDocument, options);
        }
export function useGetHistoricalBalancesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetHistoricalBalancesQuery, GetHistoricalBalancesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetHistoricalBalancesQuery, GetHistoricalBalancesQueryVariables>(GetHistoricalBalancesDocument, options);
        }
export type GetHistoricalBalancesQueryHookResult = ReturnType<typeof useGetHistoricalBalancesQuery>;
export type GetHistoricalBalancesLazyQueryHookResult = ReturnType<typeof useGetHistoricalBalancesLazyQuery>;
export type GetHistoricalBalancesSuspenseQueryHookResult = ReturnType<typeof useGetHistoricalBalancesSuspenseQuery>;
export type GetHistoricalBalancesQueryResult = Apollo.QueryResult<GetHistoricalBalancesQuery, GetHistoricalBalancesQueryVariables>;
export const GetProposalsActivityDocument = gql`
    query GetProposalsActivity($address: String!, $fromDate: NonNegativeInt, $skip: NonNegativeInt, $limit: PositiveInt, $orderBy: queryInput_proposalsActivity_orderBy, $orderDirection: queryInput_proposalsActivity_orderDirection, $userVoteFilter: queryInput_proposalsActivity_userVoteFilter) {
  proposalsActivity(
    address: $address
    fromDate: $fromDate
    skip: $skip
    limit: $limit
    orderBy: $orderBy
    orderDirection: $orderDirection
    userVoteFilter: $userVoteFilter
  ) {
    totalProposals
    votedProposals
    neverVoted
    winRate
    yesRate
    avgTimeBeforeEnd
    proposals {
      proposal {
        id
        description
        startBlock
        endBlock
        status
        againstVotes
        forVotes
        abstainVotes
        timestamp
        proposerAccountId
        daoId
      }
      userVote {
        id
        support
        votingPower
        reason
        timestamp
        proposalId
        voterAccountId
      }
    }
  }
}
    `;

/**
 * __useGetProposalsActivityQuery__
 *
 * To run a query within a React component, call `useGetProposalsActivityQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProposalsActivityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProposalsActivityQuery({
 *   variables: {
 *      address: // value for 'address'
 *      fromDate: // value for 'fromDate'
 *      skip: // value for 'skip'
 *      limit: // value for 'limit'
 *      orderBy: // value for 'orderBy'
 *      orderDirection: // value for 'orderDirection'
 *      userVoteFilter: // value for 'userVoteFilter'
 *   },
 * });
 */
export function useGetProposalsActivityQuery(baseOptions: Apollo.QueryHookOptions<GetProposalsActivityQuery, GetProposalsActivityQueryVariables> & ({ variables: GetProposalsActivityQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetProposalsActivityQuery, GetProposalsActivityQueryVariables>(GetProposalsActivityDocument, options);
      }
export function useGetProposalsActivityLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetProposalsActivityQuery, GetProposalsActivityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetProposalsActivityQuery, GetProposalsActivityQueryVariables>(GetProposalsActivityDocument, options);
        }
export function useGetProposalsActivitySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetProposalsActivityQuery, GetProposalsActivityQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetProposalsActivityQuery, GetProposalsActivityQueryVariables>(GetProposalsActivityDocument, options);
        }
export type GetProposalsActivityQueryHookResult = ReturnType<typeof useGetProposalsActivityQuery>;
export type GetProposalsActivityLazyQueryHookResult = ReturnType<typeof useGetProposalsActivityLazyQuery>;
export type GetProposalsActivitySuspenseQueryHookResult = ReturnType<typeof useGetProposalsActivitySuspenseQuery>;
export type GetProposalsActivityQueryResult = Apollo.QueryResult<GetProposalsActivityQuery, GetProposalsActivityQueryVariables>;
export const GetDaoAddressesAccountBalancesDocument = gql`
    query GetDaoAddressesAccountBalances($tokenAddresses: String!, $daoAddresses: [String]!) {
  accountBalances(
    where: {tokenId: $tokenAddresses, accountId_not_in: $daoAddresses}
    orderBy: "balance"
    orderDirection: "DESC"
    limit: 1
  ) {
    items {
      accountId
      balance
    }
  }
}
    `;

/**
 * __useGetDaoAddressesAccountBalancesQuery__
 *
 * To run a query within a React component, call `useGetDaoAddressesAccountBalancesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDaoAddressesAccountBalancesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDaoAddressesAccountBalancesQuery({
 *   variables: {
 *      tokenAddresses: // value for 'tokenAddresses'
 *      daoAddresses: // value for 'daoAddresses'
 *   },
 * });
 */
export function useGetDaoAddressesAccountBalancesQuery(baseOptions: Apollo.QueryHookOptions<GetDaoAddressesAccountBalancesQuery, GetDaoAddressesAccountBalancesQueryVariables> & ({ variables: GetDaoAddressesAccountBalancesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDaoAddressesAccountBalancesQuery, GetDaoAddressesAccountBalancesQueryVariables>(GetDaoAddressesAccountBalancesDocument, options);
      }
export function useGetDaoAddressesAccountBalancesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDaoAddressesAccountBalancesQuery, GetDaoAddressesAccountBalancesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDaoAddressesAccountBalancesQuery, GetDaoAddressesAccountBalancesQueryVariables>(GetDaoAddressesAccountBalancesDocument, options);
        }
export function useGetDaoAddressesAccountBalancesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDaoAddressesAccountBalancesQuery, GetDaoAddressesAccountBalancesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDaoAddressesAccountBalancesQuery, GetDaoAddressesAccountBalancesQueryVariables>(GetDaoAddressesAccountBalancesDocument, options);
        }
export type GetDaoAddressesAccountBalancesQueryHookResult = ReturnType<typeof useGetDaoAddressesAccountBalancesQuery>;
export type GetDaoAddressesAccountBalancesLazyQueryHookResult = ReturnType<typeof useGetDaoAddressesAccountBalancesLazyQuery>;
export type GetDaoAddressesAccountBalancesSuspenseQueryHookResult = ReturnType<typeof useGetDaoAddressesAccountBalancesSuspenseQuery>;
export type GetDaoAddressesAccountBalancesQueryResult = Apollo.QueryResult<GetDaoAddressesAccountBalancesQuery, GetDaoAddressesAccountBalancesQueryVariables>;
export const GetTopTokenHoldersDocument = gql`
    query GetTopTokenHolders($after: String, $before: String, $limit: Int, $orderDirection: String, $addresses: [String]) {
  accountBalances(
    orderBy: "balance"
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
    where: {balance_gt: 0, accountId_in: $addresses}
  ) {
    items {
      accountId
      balance
      delegate
      tokenId
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
  }
}
    `;

/**
 * __useGetTopTokenHoldersQuery__
 *
 * To run a query within a React component, call `useGetTopTokenHoldersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTopTokenHoldersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTopTokenHoldersQuery({
 *   variables: {
 *      after: // value for 'after'
 *      before: // value for 'before'
 *      limit: // value for 'limit'
 *      orderDirection: // value for 'orderDirection'
 *      addresses: // value for 'addresses'
 *   },
 * });
 */
export function useGetTopTokenHoldersQuery(baseOptions?: Apollo.QueryHookOptions<GetTopTokenHoldersQuery, GetTopTokenHoldersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTopTokenHoldersQuery, GetTopTokenHoldersQueryVariables>(GetTopTokenHoldersDocument, options);
      }
export function useGetTopTokenHoldersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTopTokenHoldersQuery, GetTopTokenHoldersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTopTokenHoldersQuery, GetTopTokenHoldersQueryVariables>(GetTopTokenHoldersDocument, options);
        }
export function useGetTopTokenHoldersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTopTokenHoldersQuery, GetTopTokenHoldersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetTopTokenHoldersQuery, GetTopTokenHoldersQueryVariables>(GetTopTokenHoldersDocument, options);
        }
export type GetTopTokenHoldersQueryHookResult = ReturnType<typeof useGetTopTokenHoldersQuery>;
export type GetTopTokenHoldersLazyQueryHookResult = ReturnType<typeof useGetTopTokenHoldersLazyQuery>;
export type GetTopTokenHoldersSuspenseQueryHookResult = ReturnType<typeof useGetTopTokenHoldersSuspenseQuery>;
export type GetTopTokenHoldersQueryResult = Apollo.QueryResult<GetTopTokenHoldersQuery, GetTopTokenHoldersQueryVariables>;
export const GetTokenHoldersCoutingDocument = gql`
    query GetTokenHoldersCouting {
  accountBalances(where: {balance_gt: 0}) {
    totalCount
  }
}
    `;

/**
 * __useGetTokenHoldersCoutingQuery__
 *
 * To run a query within a React component, call `useGetTokenHoldersCoutingQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTokenHoldersCoutingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTokenHoldersCoutingQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetTokenHoldersCoutingQuery(baseOptions?: Apollo.QueryHookOptions<GetTokenHoldersCoutingQuery, GetTokenHoldersCoutingQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTokenHoldersCoutingQuery, GetTokenHoldersCoutingQueryVariables>(GetTokenHoldersCoutingDocument, options);
      }
export function useGetTokenHoldersCoutingLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTokenHoldersCoutingQuery, GetTokenHoldersCoutingQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTokenHoldersCoutingQuery, GetTokenHoldersCoutingQueryVariables>(GetTokenHoldersCoutingDocument, options);
        }
export function useGetTokenHoldersCoutingSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTokenHoldersCoutingQuery, GetTokenHoldersCoutingQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetTokenHoldersCoutingQuery, GetTokenHoldersCoutingQueryVariables>(GetTokenHoldersCoutingDocument, options);
        }
export type GetTokenHoldersCoutingQueryHookResult = ReturnType<typeof useGetTokenHoldersCoutingQuery>;
export type GetTokenHoldersCoutingLazyQueryHookResult = ReturnType<typeof useGetTokenHoldersCoutingLazyQuery>;
export type GetTokenHoldersCoutingSuspenseQueryHookResult = ReturnType<typeof useGetTokenHoldersCoutingSuspenseQuery>;
export type GetTokenHoldersCoutingQueryResult = Apollo.QueryResult<GetTokenHoldersCoutingQuery, GetTokenHoldersCoutingQueryVariables>;
export const TransactionsDocument = gql`
    query Transactions($limit: PositiveInt, $offset: NonNegativeInt) {
  transactions(limit: $limit, offset: $offset) {
    total
    transactions {
      from
      isCex
      isDex
      isLending
      isTotal
      timestamp
      to
      transactionHash
      delegations {
        daoId
        delegateAccountId
        delegatedValue
        delegatorAccountId
        isCex
        isDex
        isTotal
        isLending
        logIndex
        previousDelegate
        timestamp
        transactionHash
      }
      transfers {
        amount
        daoId
        fromAccountId
        isCex
        isDex
        isLending
        isTotal
        logIndex
        timestamp
        toAccountId
        tokenId
        transactionHash
      }
    }
  }
}
    `;

/**
 * __useTransactionsQuery__
 *
 * To run a query within a React component, call `useTransactionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useTransactionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTransactionsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useTransactionsQuery(baseOptions?: Apollo.QueryHookOptions<TransactionsQuery, TransactionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TransactionsQuery, TransactionsQueryVariables>(TransactionsDocument, options);
      }
export function useTransactionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TransactionsQuery, TransactionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TransactionsQuery, TransactionsQueryVariables>(TransactionsDocument, options);
        }
export function useTransactionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TransactionsQuery, TransactionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TransactionsQuery, TransactionsQueryVariables>(TransactionsDocument, options);
        }
export type TransactionsQueryHookResult = ReturnType<typeof useTransactionsQuery>;
export type TransactionsLazyQueryHookResult = ReturnType<typeof useTransactionsLazyQuery>;
export type TransactionsSuspenseQueryHookResult = ReturnType<typeof useTransactionsSuspenseQuery>;
export type TransactionsQueryResult = Apollo.QueryResult<TransactionsQuery, TransactionsQueryVariables>;