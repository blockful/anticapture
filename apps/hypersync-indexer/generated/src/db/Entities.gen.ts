/* TypeScript file generated from Entities.res by genType. */

/* eslint-disable */
/* tslint:disable */

import type {EventType_t as Enums_EventType_t} from './Enums.gen';

import type {Json_t as Js_Json_t} from '../../src/Js.shim';

import type {MetricType_t as Enums_MetricType_t} from './Enums.gen';

export type id = string;

export type whereOperations<entity,fieldType> = {
  readonly eq: (_1:fieldType) => Promise<entity[]>; 
  readonly gt: (_1:fieldType) => Promise<entity[]>; 
  readonly lt: (_1:fieldType) => Promise<entity[]>
};

export type Account_t = { readonly id: id };

export type Account_indexedFieldOperations = {};

export type AccountBalance_t = {
  readonly accountId: string; 
  readonly balance: bigint; 
  readonly delegate: string; 
  readonly id: id; 
  readonly tokenId: string
};

export type AccountBalance_indexedFieldOperations = { readonly accountId: whereOperations<AccountBalance_t,string>; readonly tokenId: whereOperations<AccountBalance_t,string> };

export type AccountPower_t = {
  readonly accountId: string; 
  readonly daoId: string; 
  readonly delegationsCount: number; 
  readonly id: id; 
  readonly lastVoteTimestamp: bigint; 
  readonly proposalsCount: number; 
  readonly votesCount: number; 
  readonly votingPower: bigint
};

export type AccountPower_indexedFieldOperations = { readonly accountId: whereOperations<AccountPower_t,string> };

export type BalanceHistory_t = {
  readonly accountId: string; 
  readonly balance: bigint; 
  readonly daoId: string; 
  readonly delta: bigint; 
  readonly deltaMod: bigint; 
  readonly id: id; 
  readonly logIndex: number; 
  readonly timestamp: bigint; 
  readonly transactionHash: string
};

export type BalanceHistory_indexedFieldOperations = { readonly accountId: whereOperations<BalanceHistory_t,string>; readonly transactionHash: whereOperations<BalanceHistory_t,string> };

export type DaoMetricsDayBucket_t = {
  readonly average: bigint; 
  readonly closeValue: bigint; 
  readonly count: number; 
  readonly daoId: string; 
  readonly date: bigint; 
  readonly high: bigint; 
  readonly id: id; 
  readonly lastUpdate: bigint; 
  readonly low: bigint; 
  readonly metricType: Enums_MetricType_t; 
  readonly openValue: bigint; 
  readonly tokenId: string; 
  readonly volume: bigint
};

export type DaoMetricsDayBucket_indexedFieldOperations = { readonly tokenId: whereOperations<DaoMetricsDayBucket_t,string> };

export type Delegation_t = {
  readonly daoId: string; 
  readonly delegateAccountId: string; 
  readonly delegatedValue: bigint; 
  readonly delegationType: (undefined | number); 
  readonly delegatorAccountId: string; 
  readonly id: id; 
  readonly isCex: boolean; 
  readonly isDex: boolean; 
  readonly isLending: boolean; 
  readonly isTotal: boolean; 
  readonly logIndex: number; 
  readonly previousDelegate: (undefined | string); 
  readonly timestamp: bigint; 
  readonly transactionHash: string
};

export type Delegation_indexedFieldOperations = {
  readonly delegateAccountId: whereOperations<Delegation_t,string>; 
  readonly delegatorAccountId: whereOperations<Delegation_t,string>; 
  readonly timestamp: whereOperations<Delegation_t,bigint>; 
  readonly transactionHash: whereOperations<Delegation_t,string>
};

export type FeedEvent_t = {
  readonly eventType: Enums_EventType_t; 
  readonly id: id; 
  readonly logIndex: number; 
  readonly metadata: (undefined | Js_Json_t); 
  readonly timestamp: bigint; 
  readonly txHash: string; 
  readonly value: bigint
};

export type FeedEvent_indexedFieldOperations = {
  readonly timestamp: whereOperations<FeedEvent_t,bigint>; 
  readonly txHash: whereOperations<FeedEvent_t,string>; 
  readonly value: whereOperations<FeedEvent_t,bigint>
};

export type ProposalOnchain_t = {
  readonly abstainVotes: bigint; 
  readonly againstVotes: bigint; 
  readonly calldatas: Js_Json_t; 
  readonly daoId: string; 
  readonly description: string; 
  readonly endBlock: number; 
  readonly endTimestamp: bigint; 
  readonly forVotes: bigint; 
  readonly id: id; 
  readonly logIndex: number; 
  readonly proposalType: (undefined | number); 
  readonly proposerAccountId: string; 
  readonly signatures: Js_Json_t; 
  readonly startBlock: number; 
  readonly status: string; 
  readonly targets: Js_Json_t; 
  readonly timestamp: bigint; 
  readonly title: string; 
  readonly txHash: string; 
  readonly values: Js_Json_t
};

export type ProposalOnchain_indexedFieldOperations = { readonly proposerAccountId: whereOperations<ProposalOnchain_t,string> };

export type Token_t = {
  readonly cexSupply: bigint; 
  readonly circulatingSupply: bigint; 
  readonly decimals: number; 
  readonly delegatedSupply: bigint; 
  readonly dexSupply: bigint; 
  readonly id: id; 
  readonly lendingSupply: bigint; 
  readonly name: (undefined | string); 
  readonly nonCirculatingSupply: bigint; 
  readonly totalSupply: bigint; 
  readonly treasury: bigint
};

export type Token_indexedFieldOperations = {};

export type TokenPrice_t = {
  readonly id: id; 
  readonly price: bigint; 
  readonly timestamp: bigint
};

export type TokenPrice_indexedFieldOperations = {};

export type Transaction_t = {
  readonly fromAddress: (undefined | string); 
  readonly id: id; 
  readonly isCex: boolean; 
  readonly isDex: boolean; 
  readonly isLending: boolean; 
  readonly isTotal: boolean; 
  readonly timestamp: bigint; 
  readonly toAddress: (undefined | string); 
  readonly transactionHash: string
};

export type Transaction_indexedFieldOperations = {};

export type Transfer_t = {
  readonly amount: bigint; 
  readonly daoId: string; 
  readonly fromAccountId: string; 
  readonly id: id; 
  readonly isCex: boolean; 
  readonly isDex: boolean; 
  readonly isLending: boolean; 
  readonly isTotal: boolean; 
  readonly logIndex: number; 
  readonly timestamp: bigint; 
  readonly toAccountId: string; 
  readonly tokenId: string; 
  readonly transactionHash: string
};

export type Transfer_indexedFieldOperations = {
  readonly amount: whereOperations<Transfer_t,bigint>; 
  readonly fromAccountId: whereOperations<Transfer_t,string>; 
  readonly timestamp: whereOperations<Transfer_t,bigint>; 
  readonly toAccountId: whereOperations<Transfer_t,string>; 
  readonly tokenId: whereOperations<Transfer_t,string>; 
  readonly transactionHash: whereOperations<Transfer_t,string>
};

export type VoteOnchain_t = {
  readonly daoId: string; 
  readonly id: id; 
  readonly proposalId: string; 
  readonly reason: (undefined | string); 
  readonly support: string; 
  readonly timestamp: bigint; 
  readonly txHash: string; 
  readonly voterAccountId: string; 
  readonly votingPower: bigint
};

export type VoteOnchain_indexedFieldOperations = { readonly proposalId: whereOperations<VoteOnchain_t,string>; readonly voterAccountId: whereOperations<VoteOnchain_t,string> };

export type VotingPowerHistory_t = {
  readonly accountId: string; 
  readonly daoId: string; 
  readonly delta: bigint; 
  readonly deltaMod: bigint; 
  readonly id: id; 
  readonly logIndex: number; 
  readonly timestamp: bigint; 
  readonly transactionHash: string; 
  readonly votingPower: bigint
};

export type VotingPowerHistory_indexedFieldOperations = { readonly accountId: whereOperations<VotingPowerHistory_t,string>; readonly transactionHash: whereOperations<VotingPowerHistory_t,string> };
