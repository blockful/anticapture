/* TypeScript file generated from Types.res by genType. */

/* eslint-disable */
/* tslint:disable */

import type {AccountBalance_t as Entities_AccountBalance_t} from '../src/db/Entities.gen';

import type {AccountPower_t as Entities_AccountPower_t} from '../src/db/Entities.gen';

import type {Account_t as Entities_Account_t} from '../src/db/Entities.gen';

import type {BalanceHistory_t as Entities_BalanceHistory_t} from '../src/db/Entities.gen';

import type {DaoMetricsDayBucket_t as Entities_DaoMetricsDayBucket_t} from '../src/db/Entities.gen';

import type {Delegation_t as Entities_Delegation_t} from '../src/db/Entities.gen';

import type {FeedEvent_t as Entities_FeedEvent_t} from '../src/db/Entities.gen';

import type {HandlerContext as $$handlerContext} from './Types.ts';

import type {HandlerWithOptions as $$fnWithEventConfig} from './bindings/OpaqueTypes.ts';

import type {LoaderContext as $$loaderContext} from './Types.ts';

import type {ProposalOnchain_t as Entities_ProposalOnchain_t} from '../src/db/Entities.gen';

import type {SingleOrMultiple as $$SingleOrMultiple_t} from './bindings/OpaqueTypes';

import type {TokenPrice_t as Entities_TokenPrice_t} from '../src/db/Entities.gen';

import type {Token_t as Entities_Token_t} from '../src/db/Entities.gen';

import type {Transaction_t as Entities_Transaction_t} from '../src/db/Entities.gen';

import type {Transfer_t as Entities_Transfer_t} from '../src/db/Entities.gen';

import type {VoteOnchain_t as Entities_VoteOnchain_t} from '../src/db/Entities.gen';

import type {VotingPowerHistory_t as Entities_VotingPowerHistory_t} from '../src/db/Entities.gen';

import type {entityHandlerContext as Internal_entityHandlerContext} from 'envio/src/Internal.gen';

import type {eventOptions as Internal_eventOptions} from 'envio/src/Internal.gen';

import type {genericContractRegisterArgs as Internal_genericContractRegisterArgs} from 'envio/src/Internal.gen';

import type {genericContractRegister as Internal_genericContractRegister} from 'envio/src/Internal.gen';

import type {genericEvent as Internal_genericEvent} from 'envio/src/Internal.gen';

import type {genericHandlerArgs as Internal_genericHandlerArgs} from 'envio/src/Internal.gen';

import type {genericHandlerWithLoader as Internal_genericHandlerWithLoader} from 'envio/src/Internal.gen';

import type {genericHandler as Internal_genericHandler} from 'envio/src/Internal.gen';

import type {genericLoaderArgs as Internal_genericLoaderArgs} from 'envio/src/Internal.gen';

import type {genericLoader as Internal_genericLoader} from 'envio/src/Internal.gen';

import type {logger as Envio_logger} from 'envio/src/Envio.gen';

import type {noEventFilters as Internal_noEventFilters} from 'envio/src/Internal.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

export type id = string;
export type Id = id;

export type contractRegistrations = {
  readonly log: Envio_logger; 
  readonly addENSGovernor: (_1:Address_t) => void; 
  readonly addENSToken: (_1:Address_t) => void
};

export type entityLoaderContext<entity,indexedFieldOperations> = {
  readonly get: (_1:id) => Promise<(undefined | entity)>; 
  readonly getOrThrow: (_1:id, message:(undefined | string)) => Promise<entity>; 
  readonly getWhere: indexedFieldOperations; 
  readonly getOrCreate: (_1:entity) => Promise<entity>; 
  readonly set: (_1:entity) => void; 
  readonly deleteUnsafe: (_1:id) => void
};

export type loaderContext = $$loaderContext;

export type entityHandlerContext<entity> = Internal_entityHandlerContext<entity>;

export type handlerContext = $$handlerContext;

export type account = Entities_Account_t;
export type Account = account;

export type accountBalance = Entities_AccountBalance_t;
export type AccountBalance = accountBalance;

export type accountPower = Entities_AccountPower_t;
export type AccountPower = accountPower;

export type balanceHistory = Entities_BalanceHistory_t;
export type BalanceHistory = balanceHistory;

export type daoMetricsDayBucket = Entities_DaoMetricsDayBucket_t;
export type DaoMetricsDayBucket = daoMetricsDayBucket;

export type delegation = Entities_Delegation_t;
export type Delegation = delegation;

export type feedEvent = Entities_FeedEvent_t;
export type FeedEvent = feedEvent;

export type proposalOnchain = Entities_ProposalOnchain_t;
export type ProposalOnchain = proposalOnchain;

export type token = Entities_Token_t;
export type Token = token;

export type tokenPrice = Entities_TokenPrice_t;
export type TokenPrice = tokenPrice;

export type transaction = Entities_Transaction_t;
export type Transaction = transaction;

export type transfer = Entities_Transfer_t;
export type Transfer = transfer;

export type voteOnchain = Entities_VoteOnchain_t;
export type VoteOnchain = voteOnchain;

export type votingPowerHistory = Entities_VotingPowerHistory_t;
export type VotingPowerHistory = votingPowerHistory;

export type Transaction_t = {
  readonly hash: string; 
  readonly to: (undefined | Address_t); 
  readonly from: (undefined | Address_t)
};

export type Block_t = {
  readonly number: number; 
  readonly timestamp: number; 
  readonly hash: string
};

export type AggregatedBlock_t = {
  readonly hash: string; 
  readonly number: number; 
  readonly timestamp: number
};

export type AggregatedTransaction_t = {
  readonly from: (undefined | Address_t); 
  readonly hash: string; 
  readonly to: (undefined | Address_t)
};

export type eventLog<params> = Internal_genericEvent<params,Block_t,Transaction_t>;
export type EventLog<params> = eventLog<params>;

export type SingleOrMultiple_t<a> = $$SingleOrMultiple_t<a>;

export type HandlerTypes_args<eventArgs,context> = { readonly event: eventLog<eventArgs>; readonly context: context };

export type HandlerTypes_contractRegisterArgs<eventArgs> = Internal_genericContractRegisterArgs<eventLog<eventArgs>,contractRegistrations>;

export type HandlerTypes_contractRegister<eventArgs> = Internal_genericContractRegister<HandlerTypes_contractRegisterArgs<eventArgs>>;

export type HandlerTypes_loaderArgs<eventArgs> = Internal_genericLoaderArgs<eventLog<eventArgs>,loaderContext>;

export type HandlerTypes_loader<eventArgs,loaderReturn> = Internal_genericLoader<HandlerTypes_loaderArgs<eventArgs>,loaderReturn>;

export type HandlerTypes_handlerArgs<eventArgs,loaderReturn> = Internal_genericHandlerArgs<eventLog<eventArgs>,handlerContext,loaderReturn>;

export type HandlerTypes_handler<eventArgs,loaderReturn> = Internal_genericHandler<HandlerTypes_handlerArgs<eventArgs,loaderReturn>>;

export type HandlerTypes_loaderHandler<eventArgs,loaderReturn,eventFilters> = Internal_genericHandlerWithLoader<HandlerTypes_loader<eventArgs,loaderReturn>,HandlerTypes_handler<eventArgs,loaderReturn>,eventFilters>;

export type HandlerTypes_eventConfig<eventFilters> = Internal_eventOptions<eventFilters>;

export type fnWithEventConfig<fn,eventConfig> = $$fnWithEventConfig<fn,eventConfig>;

export type handlerWithOptions<eventArgs,loaderReturn,eventFilters> = fnWithEventConfig<HandlerTypes_handler<eventArgs,loaderReturn>,HandlerTypes_eventConfig<eventFilters>>;

export type contractRegisterWithOptions<eventArgs,eventFilters> = fnWithEventConfig<HandlerTypes_contractRegister<eventArgs>,HandlerTypes_eventConfig<eventFilters>>;

export type ENSGovernor_chainId = 1;

export type ENSGovernor_ProposalCreated_eventArgs = {
  readonly proposalId: bigint; 
  readonly proposer: Address_t; 
  readonly targets: Address_t[]; 
  readonly values: bigint[]; 
  readonly signatures: string[]; 
  readonly calldatas: string[]; 
  readonly startBlock: bigint; 
  readonly endBlock: bigint; 
  readonly description: string
};

export type ENSGovernor_ProposalCreated_block = Block_t;

export type ENSGovernor_ProposalCreated_transaction = Transaction_t;

export type ENSGovernor_ProposalCreated_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: ENSGovernor_ProposalCreated_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: ENSGovernor_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: ENSGovernor_ProposalCreated_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: ENSGovernor_ProposalCreated_block
};

export type ENSGovernor_ProposalCreated_loaderArgs = Internal_genericLoaderArgs<ENSGovernor_ProposalCreated_event,loaderContext>;

export type ENSGovernor_ProposalCreated_loader<loaderReturn> = Internal_genericLoader<ENSGovernor_ProposalCreated_loaderArgs,loaderReturn>;

export type ENSGovernor_ProposalCreated_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<ENSGovernor_ProposalCreated_event,handlerContext,loaderReturn>;

export type ENSGovernor_ProposalCreated_handler<loaderReturn> = Internal_genericHandler<ENSGovernor_ProposalCreated_handlerArgs<loaderReturn>>;

export type ENSGovernor_ProposalCreated_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ENSGovernor_ProposalCreated_event,contractRegistrations>>;

export type ENSGovernor_ProposalCreated_eventFilter = {};

export type ENSGovernor_ProposalCreated_eventFilters = Internal_noEventFilters;

export type ENSGovernor_VoteCast_eventArgs = {
  readonly voter: Address_t; 
  readonly proposalId: bigint; 
  readonly support: bigint; 
  readonly weight: bigint; 
  readonly reason: string
};

export type ENSGovernor_VoteCast_block = Block_t;

export type ENSGovernor_VoteCast_transaction = Transaction_t;

export type ENSGovernor_VoteCast_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: ENSGovernor_VoteCast_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: ENSGovernor_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: ENSGovernor_VoteCast_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: ENSGovernor_VoteCast_block
};

export type ENSGovernor_VoteCast_loaderArgs = Internal_genericLoaderArgs<ENSGovernor_VoteCast_event,loaderContext>;

export type ENSGovernor_VoteCast_loader<loaderReturn> = Internal_genericLoader<ENSGovernor_VoteCast_loaderArgs,loaderReturn>;

export type ENSGovernor_VoteCast_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<ENSGovernor_VoteCast_event,handlerContext,loaderReturn>;

export type ENSGovernor_VoteCast_handler<loaderReturn> = Internal_genericHandler<ENSGovernor_VoteCast_handlerArgs<loaderReturn>>;

export type ENSGovernor_VoteCast_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ENSGovernor_VoteCast_event,contractRegistrations>>;

export type ENSGovernor_VoteCast_eventFilter = { readonly voter?: SingleOrMultiple_t<Address_t> };

export type ENSGovernor_VoteCast_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: ENSGovernor_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type ENSGovernor_VoteCast_eventFiltersDefinition = 
    ENSGovernor_VoteCast_eventFilter
  | ENSGovernor_VoteCast_eventFilter[];

export type ENSGovernor_VoteCast_eventFilters = 
    ENSGovernor_VoteCast_eventFilter
  | ENSGovernor_VoteCast_eventFilter[]
  | ((_1:ENSGovernor_VoteCast_eventFiltersArgs) => ENSGovernor_VoteCast_eventFiltersDefinition);

export type ENSGovernor_ProposalCanceled_eventArgs = { readonly proposalId: bigint };

export type ENSGovernor_ProposalCanceled_block = Block_t;

export type ENSGovernor_ProposalCanceled_transaction = Transaction_t;

export type ENSGovernor_ProposalCanceled_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: ENSGovernor_ProposalCanceled_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: ENSGovernor_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: ENSGovernor_ProposalCanceled_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: ENSGovernor_ProposalCanceled_block
};

export type ENSGovernor_ProposalCanceled_loaderArgs = Internal_genericLoaderArgs<ENSGovernor_ProposalCanceled_event,loaderContext>;

export type ENSGovernor_ProposalCanceled_loader<loaderReturn> = Internal_genericLoader<ENSGovernor_ProposalCanceled_loaderArgs,loaderReturn>;

export type ENSGovernor_ProposalCanceled_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<ENSGovernor_ProposalCanceled_event,handlerContext,loaderReturn>;

export type ENSGovernor_ProposalCanceled_handler<loaderReturn> = Internal_genericHandler<ENSGovernor_ProposalCanceled_handlerArgs<loaderReturn>>;

export type ENSGovernor_ProposalCanceled_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ENSGovernor_ProposalCanceled_event,contractRegistrations>>;

export type ENSGovernor_ProposalCanceled_eventFilter = {};

export type ENSGovernor_ProposalCanceled_eventFilters = Internal_noEventFilters;

export type ENSGovernor_ProposalExecuted_eventArgs = { readonly proposalId: bigint };

export type ENSGovernor_ProposalExecuted_block = Block_t;

export type ENSGovernor_ProposalExecuted_transaction = Transaction_t;

export type ENSGovernor_ProposalExecuted_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: ENSGovernor_ProposalExecuted_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: ENSGovernor_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: ENSGovernor_ProposalExecuted_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: ENSGovernor_ProposalExecuted_block
};

export type ENSGovernor_ProposalExecuted_loaderArgs = Internal_genericLoaderArgs<ENSGovernor_ProposalExecuted_event,loaderContext>;

export type ENSGovernor_ProposalExecuted_loader<loaderReturn> = Internal_genericLoader<ENSGovernor_ProposalExecuted_loaderArgs,loaderReturn>;

export type ENSGovernor_ProposalExecuted_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<ENSGovernor_ProposalExecuted_event,handlerContext,loaderReturn>;

export type ENSGovernor_ProposalExecuted_handler<loaderReturn> = Internal_genericHandler<ENSGovernor_ProposalExecuted_handlerArgs<loaderReturn>>;

export type ENSGovernor_ProposalExecuted_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ENSGovernor_ProposalExecuted_event,contractRegistrations>>;

export type ENSGovernor_ProposalExecuted_eventFilter = {};

export type ENSGovernor_ProposalExecuted_eventFilters = Internal_noEventFilters;

export type ENSGovernor_ProposalQueued_eventArgs = { readonly proposalId: bigint; readonly eta: bigint };

export type ENSGovernor_ProposalQueued_block = Block_t;

export type ENSGovernor_ProposalQueued_transaction = Transaction_t;

export type ENSGovernor_ProposalQueued_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: ENSGovernor_ProposalQueued_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: ENSGovernor_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: ENSGovernor_ProposalQueued_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: ENSGovernor_ProposalQueued_block
};

export type ENSGovernor_ProposalQueued_loaderArgs = Internal_genericLoaderArgs<ENSGovernor_ProposalQueued_event,loaderContext>;

export type ENSGovernor_ProposalQueued_loader<loaderReturn> = Internal_genericLoader<ENSGovernor_ProposalQueued_loaderArgs,loaderReturn>;

export type ENSGovernor_ProposalQueued_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<ENSGovernor_ProposalQueued_event,handlerContext,loaderReturn>;

export type ENSGovernor_ProposalQueued_handler<loaderReturn> = Internal_genericHandler<ENSGovernor_ProposalQueued_handlerArgs<loaderReturn>>;

export type ENSGovernor_ProposalQueued_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ENSGovernor_ProposalQueued_event,contractRegistrations>>;

export type ENSGovernor_ProposalQueued_eventFilter = {};

export type ENSGovernor_ProposalQueued_eventFilters = Internal_noEventFilters;

export type ENSToken_chainId = 1;

export type ENSToken_Transfer_eventArgs = {
  readonly from: Address_t; 
  readonly to: Address_t; 
  readonly value: bigint
};

export type ENSToken_Transfer_block = Block_t;

export type ENSToken_Transfer_transaction = Transaction_t;

export type ENSToken_Transfer_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: ENSToken_Transfer_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: ENSToken_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: ENSToken_Transfer_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: ENSToken_Transfer_block
};

export type ENSToken_Transfer_loaderArgs = Internal_genericLoaderArgs<ENSToken_Transfer_event,loaderContext>;

export type ENSToken_Transfer_loader<loaderReturn> = Internal_genericLoader<ENSToken_Transfer_loaderArgs,loaderReturn>;

export type ENSToken_Transfer_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<ENSToken_Transfer_event,handlerContext,loaderReturn>;

export type ENSToken_Transfer_handler<loaderReturn> = Internal_genericHandler<ENSToken_Transfer_handlerArgs<loaderReturn>>;

export type ENSToken_Transfer_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ENSToken_Transfer_event,contractRegistrations>>;

export type ENSToken_Transfer_eventFilter = { readonly from?: SingleOrMultiple_t<Address_t>; readonly to?: SingleOrMultiple_t<Address_t> };

export type ENSToken_Transfer_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: ENSToken_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type ENSToken_Transfer_eventFiltersDefinition = 
    ENSToken_Transfer_eventFilter
  | ENSToken_Transfer_eventFilter[];

export type ENSToken_Transfer_eventFilters = 
    ENSToken_Transfer_eventFilter
  | ENSToken_Transfer_eventFilter[]
  | ((_1:ENSToken_Transfer_eventFiltersArgs) => ENSToken_Transfer_eventFiltersDefinition);

export type ENSToken_DelegateChanged_eventArgs = {
  readonly delegator: Address_t; 
  readonly fromDelegate: Address_t; 
  readonly toDelegate: Address_t
};

export type ENSToken_DelegateChanged_block = Block_t;

export type ENSToken_DelegateChanged_transaction = Transaction_t;

export type ENSToken_DelegateChanged_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: ENSToken_DelegateChanged_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: ENSToken_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: ENSToken_DelegateChanged_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: ENSToken_DelegateChanged_block
};

export type ENSToken_DelegateChanged_loaderArgs = Internal_genericLoaderArgs<ENSToken_DelegateChanged_event,loaderContext>;

export type ENSToken_DelegateChanged_loader<loaderReturn> = Internal_genericLoader<ENSToken_DelegateChanged_loaderArgs,loaderReturn>;

export type ENSToken_DelegateChanged_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<ENSToken_DelegateChanged_event,handlerContext,loaderReturn>;

export type ENSToken_DelegateChanged_handler<loaderReturn> = Internal_genericHandler<ENSToken_DelegateChanged_handlerArgs<loaderReturn>>;

export type ENSToken_DelegateChanged_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ENSToken_DelegateChanged_event,contractRegistrations>>;

export type ENSToken_DelegateChanged_eventFilter = {
  readonly delegator?: SingleOrMultiple_t<Address_t>; 
  readonly fromDelegate?: SingleOrMultiple_t<Address_t>; 
  readonly toDelegate?: SingleOrMultiple_t<Address_t>
};

export type ENSToken_DelegateChanged_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: ENSToken_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type ENSToken_DelegateChanged_eventFiltersDefinition = 
    ENSToken_DelegateChanged_eventFilter
  | ENSToken_DelegateChanged_eventFilter[];

export type ENSToken_DelegateChanged_eventFilters = 
    ENSToken_DelegateChanged_eventFilter
  | ENSToken_DelegateChanged_eventFilter[]
  | ((_1:ENSToken_DelegateChanged_eventFiltersArgs) => ENSToken_DelegateChanged_eventFiltersDefinition);

export type ENSToken_DelegateVotesChanged_eventArgs = {
  readonly delegate: Address_t; 
  readonly previousBalance: bigint; 
  readonly newBalance: bigint
};

export type ENSToken_DelegateVotesChanged_block = Block_t;

export type ENSToken_DelegateVotesChanged_transaction = Transaction_t;

export type ENSToken_DelegateVotesChanged_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: ENSToken_DelegateVotesChanged_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: ENSToken_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: ENSToken_DelegateVotesChanged_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: ENSToken_DelegateVotesChanged_block
};

export type ENSToken_DelegateVotesChanged_loaderArgs = Internal_genericLoaderArgs<ENSToken_DelegateVotesChanged_event,loaderContext>;

export type ENSToken_DelegateVotesChanged_loader<loaderReturn> = Internal_genericLoader<ENSToken_DelegateVotesChanged_loaderArgs,loaderReturn>;

export type ENSToken_DelegateVotesChanged_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<ENSToken_DelegateVotesChanged_event,handlerContext,loaderReturn>;

export type ENSToken_DelegateVotesChanged_handler<loaderReturn> = Internal_genericHandler<ENSToken_DelegateVotesChanged_handlerArgs<loaderReturn>>;

export type ENSToken_DelegateVotesChanged_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ENSToken_DelegateVotesChanged_event,contractRegistrations>>;

export type ENSToken_DelegateVotesChanged_eventFilter = { readonly delegate?: SingleOrMultiple_t<Address_t> };

export type ENSToken_DelegateVotesChanged_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: ENSToken_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type ENSToken_DelegateVotesChanged_eventFiltersDefinition = 
    ENSToken_DelegateVotesChanged_eventFilter
  | ENSToken_DelegateVotesChanged_eventFilter[];

export type ENSToken_DelegateVotesChanged_eventFilters = 
    ENSToken_DelegateVotesChanged_eventFilter
  | ENSToken_DelegateVotesChanged_eventFilter[]
  | ((_1:ENSToken_DelegateVotesChanged_eventFiltersArgs) => ENSToken_DelegateVotesChanged_eventFiltersDefinition);

export type chainId = number;

export type chain = 1;
