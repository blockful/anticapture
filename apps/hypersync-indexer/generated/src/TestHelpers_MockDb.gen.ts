/* TypeScript file generated from TestHelpers_MockDb.res by genType. */

/* eslint-disable */
/* tslint:disable */

const TestHelpers_MockDbJS = require('./TestHelpers_MockDb.res.js');

import type {AccountBalance_t as Entities_AccountBalance_t} from '../src/db/Entities.gen';

import type {AccountPower_t as Entities_AccountPower_t} from '../src/db/Entities.gen';

import type {Account_t as Entities_Account_t} from '../src/db/Entities.gen';

import type {BalanceHistory_t as Entities_BalanceHistory_t} from '../src/db/Entities.gen';

import type {DaoMetricsDayBucket_t as Entities_DaoMetricsDayBucket_t} from '../src/db/Entities.gen';

import type {Delegation_t as Entities_Delegation_t} from '../src/db/Entities.gen';

import type {DynamicContractRegistry_t as InternalTable_DynamicContractRegistry_t} from 'envio/src/db/InternalTable.gen';

import type {FeedEvent_t as Entities_FeedEvent_t} from '../src/db/Entities.gen';

import type {ProposalOnchain_t as Entities_ProposalOnchain_t} from '../src/db/Entities.gen';

import type {RawEvents_t as InternalTable_RawEvents_t} from 'envio/src/db/InternalTable.gen';

import type {TokenPrice_t as Entities_TokenPrice_t} from '../src/db/Entities.gen';

import type {Token_t as Entities_Token_t} from '../src/db/Entities.gen';

import type {Transaction_t as Entities_Transaction_t} from '../src/db/Entities.gen';

import type {Transfer_t as Entities_Transfer_t} from '../src/db/Entities.gen';

import type {VoteOnchain_t as Entities_VoteOnchain_t} from '../src/db/Entities.gen';

import type {VotingPowerHistory_t as Entities_VotingPowerHistory_t} from '../src/db/Entities.gen';

import type {eventLog as Types_eventLog} from './Types.gen';

import type {rawEventsKey as InMemoryStore_rawEventsKey} from 'envio/src/InMemoryStore.gen';

/** The mockDb type is simply an InMemoryStore internally. __dbInternal__ holds a reference
to an inMemoryStore and all the the accessor methods point to the reference of that inMemory
store */
export abstract class inMemoryStore { protected opaque!: any }; /* simulate opaque types */

export type t = {
  readonly __dbInternal__: inMemoryStore; 
  readonly entities: entities; 
  readonly rawEvents: storeOperations<InMemoryStore_rawEventsKey,InternalTable_RawEvents_t>; 
  readonly dynamicContractRegistry: entityStoreOperations<InternalTable_DynamicContractRegistry_t>; 
  readonly processEvents: (_1:Types_eventLog<unknown>[]) => Promise<t>
};

export type entities = {
  readonly Account: entityStoreOperations<Entities_Account_t>; 
  readonly AccountBalance: entityStoreOperations<Entities_AccountBalance_t>; 
  readonly AccountPower: entityStoreOperations<Entities_AccountPower_t>; 
  readonly BalanceHistory: entityStoreOperations<Entities_BalanceHistory_t>; 
  readonly DaoMetricsDayBucket: entityStoreOperations<Entities_DaoMetricsDayBucket_t>; 
  readonly Delegation: entityStoreOperations<Entities_Delegation_t>; 
  readonly FeedEvent: entityStoreOperations<Entities_FeedEvent_t>; 
  readonly ProposalOnchain: entityStoreOperations<Entities_ProposalOnchain_t>; 
  readonly Token: entityStoreOperations<Entities_Token_t>; 
  readonly TokenPrice: entityStoreOperations<Entities_TokenPrice_t>; 
  readonly Transaction: entityStoreOperations<Entities_Transaction_t>; 
  readonly Transfer: entityStoreOperations<Entities_Transfer_t>; 
  readonly VoteOnchain: entityStoreOperations<Entities_VoteOnchain_t>; 
  readonly VotingPowerHistory: entityStoreOperations<Entities_VotingPowerHistory_t>
};

export type entityStoreOperations<entity> = storeOperations<string,entity>;

export type storeOperations<entityKey,entity> = {
  readonly getAll: () => entity[]; 
  readonly get: (_1:entityKey) => (undefined | entity); 
  readonly set: (_1:entity) => t; 
  readonly delete: (_1:entityKey) => t
};

/** The constructor function for a mockDb. Call it and then set up the inital state by calling
any of the set functions it provides access to. A mockDb will be passed into a processEvent 
helper. Note, process event helpers will not mutate the mockDb but return a new mockDb with
new state so you can compare states before and after. */
export const createMockDb: () => t = TestHelpers_MockDbJS.createMockDb as any;
