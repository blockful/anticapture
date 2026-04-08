/* TypeScript file generated from TestHelpers.res by genType. */

/* eslint-disable */
/* tslint:disable */

const TestHelpersJS = require('./TestHelpers.res.js');

import type {ENSGovernor_ProposalCanceled_event as Types_ENSGovernor_ProposalCanceled_event} from './Types.gen';

import type {ENSGovernor_ProposalCreated_event as Types_ENSGovernor_ProposalCreated_event} from './Types.gen';

import type {ENSGovernor_ProposalExecuted_event as Types_ENSGovernor_ProposalExecuted_event} from './Types.gen';

import type {ENSGovernor_ProposalQueued_event as Types_ENSGovernor_ProposalQueued_event} from './Types.gen';

import type {ENSGovernor_VoteCast_event as Types_ENSGovernor_VoteCast_event} from './Types.gen';

import type {ENSToken_DelegateChanged_event as Types_ENSToken_DelegateChanged_event} from './Types.gen';

import type {ENSToken_DelegateVotesChanged_event as Types_ENSToken_DelegateVotesChanged_event} from './Types.gen';

import type {ENSToken_Transfer_event as Types_ENSToken_Transfer_event} from './Types.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

import type {t as TestHelpers_MockDb_t} from './TestHelpers_MockDb.gen';

/** The arguements that get passed to a "processEvent" helper function */
export type EventFunctions_eventProcessorArgs<event> = {
  readonly event: event; 
  readonly mockDb: TestHelpers_MockDb_t; 
  readonly chainId?: number
};

export type EventFunctions_eventProcessor<event> = (_1:EventFunctions_eventProcessorArgs<event>) => Promise<TestHelpers_MockDb_t>;

export type EventFunctions_MockBlock_t = {
  readonly hash?: string; 
  readonly number?: number; 
  readonly timestamp?: number
};

export type EventFunctions_MockTransaction_t = {
  readonly from?: (undefined | Address_t); 
  readonly hash?: string; 
  readonly to?: (undefined | Address_t)
};

export type EventFunctions_mockEventData = {
  readonly chainId?: number; 
  readonly srcAddress?: Address_t; 
  readonly logIndex?: number; 
  readonly block?: EventFunctions_MockBlock_t; 
  readonly transaction?: EventFunctions_MockTransaction_t
};

export type ENSGovernor_ProposalCreated_createMockArgs = {
  readonly proposalId?: bigint; 
  readonly proposer?: Address_t; 
  readonly targets?: Address_t[]; 
  readonly values?: bigint[]; 
  readonly signatures?: string[]; 
  readonly calldatas?: string[]; 
  readonly startBlock?: bigint; 
  readonly endBlock?: bigint; 
  readonly description?: string; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type ENSGovernor_VoteCast_createMockArgs = {
  readonly voter?: Address_t; 
  readonly proposalId?: bigint; 
  readonly support?: bigint; 
  readonly weight?: bigint; 
  readonly reason?: string; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type ENSGovernor_ProposalCanceled_createMockArgs = { readonly proposalId?: bigint; readonly mockEventData?: EventFunctions_mockEventData };

export type ENSGovernor_ProposalExecuted_createMockArgs = { readonly proposalId?: bigint; readonly mockEventData?: EventFunctions_mockEventData };

export type ENSGovernor_ProposalQueued_createMockArgs = {
  readonly proposalId?: bigint; 
  readonly eta?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type ENSToken_Transfer_createMockArgs = {
  readonly from?: Address_t; 
  readonly to?: Address_t; 
  readonly value?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type ENSToken_DelegateChanged_createMockArgs = {
  readonly delegator?: Address_t; 
  readonly fromDelegate?: Address_t; 
  readonly toDelegate?: Address_t; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type ENSToken_DelegateVotesChanged_createMockArgs = {
  readonly delegate?: Address_t; 
  readonly previousBalance?: bigint; 
  readonly newBalance?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export const MockDb_createMockDb: () => TestHelpers_MockDb_t = TestHelpersJS.MockDb.createMockDb as any;

export const Addresses_mockAddresses: Address_t[] = TestHelpersJS.Addresses.mockAddresses as any;

export const Addresses_defaultAddress: Address_t = TestHelpersJS.Addresses.defaultAddress as any;

export const ENSGovernor_ProposalCreated_processEvent: EventFunctions_eventProcessor<Types_ENSGovernor_ProposalCreated_event> = TestHelpersJS.ENSGovernor.ProposalCreated.processEvent as any;

export const ENSGovernor_ProposalCreated_createMockEvent: (args:ENSGovernor_ProposalCreated_createMockArgs) => Types_ENSGovernor_ProposalCreated_event = TestHelpersJS.ENSGovernor.ProposalCreated.createMockEvent as any;

export const ENSGovernor_VoteCast_processEvent: EventFunctions_eventProcessor<Types_ENSGovernor_VoteCast_event> = TestHelpersJS.ENSGovernor.VoteCast.processEvent as any;

export const ENSGovernor_VoteCast_createMockEvent: (args:ENSGovernor_VoteCast_createMockArgs) => Types_ENSGovernor_VoteCast_event = TestHelpersJS.ENSGovernor.VoteCast.createMockEvent as any;

export const ENSGovernor_ProposalCanceled_processEvent: EventFunctions_eventProcessor<Types_ENSGovernor_ProposalCanceled_event> = TestHelpersJS.ENSGovernor.ProposalCanceled.processEvent as any;

export const ENSGovernor_ProposalCanceled_createMockEvent: (args:ENSGovernor_ProposalCanceled_createMockArgs) => Types_ENSGovernor_ProposalCanceled_event = TestHelpersJS.ENSGovernor.ProposalCanceled.createMockEvent as any;

export const ENSGovernor_ProposalExecuted_processEvent: EventFunctions_eventProcessor<Types_ENSGovernor_ProposalExecuted_event> = TestHelpersJS.ENSGovernor.ProposalExecuted.processEvent as any;

export const ENSGovernor_ProposalExecuted_createMockEvent: (args:ENSGovernor_ProposalExecuted_createMockArgs) => Types_ENSGovernor_ProposalExecuted_event = TestHelpersJS.ENSGovernor.ProposalExecuted.createMockEvent as any;

export const ENSGovernor_ProposalQueued_processEvent: EventFunctions_eventProcessor<Types_ENSGovernor_ProposalQueued_event> = TestHelpersJS.ENSGovernor.ProposalQueued.processEvent as any;

export const ENSGovernor_ProposalQueued_createMockEvent: (args:ENSGovernor_ProposalQueued_createMockArgs) => Types_ENSGovernor_ProposalQueued_event = TestHelpersJS.ENSGovernor.ProposalQueued.createMockEvent as any;

export const ENSToken_Transfer_processEvent: EventFunctions_eventProcessor<Types_ENSToken_Transfer_event> = TestHelpersJS.ENSToken.Transfer.processEvent as any;

export const ENSToken_Transfer_createMockEvent: (args:ENSToken_Transfer_createMockArgs) => Types_ENSToken_Transfer_event = TestHelpersJS.ENSToken.Transfer.createMockEvent as any;

export const ENSToken_DelegateChanged_processEvent: EventFunctions_eventProcessor<Types_ENSToken_DelegateChanged_event> = TestHelpersJS.ENSToken.DelegateChanged.processEvent as any;

export const ENSToken_DelegateChanged_createMockEvent: (args:ENSToken_DelegateChanged_createMockArgs) => Types_ENSToken_DelegateChanged_event = TestHelpersJS.ENSToken.DelegateChanged.createMockEvent as any;

export const ENSToken_DelegateVotesChanged_processEvent: EventFunctions_eventProcessor<Types_ENSToken_DelegateVotesChanged_event> = TestHelpersJS.ENSToken.DelegateVotesChanged.processEvent as any;

export const ENSToken_DelegateVotesChanged_createMockEvent: (args:ENSToken_DelegateVotesChanged_createMockArgs) => Types_ENSToken_DelegateVotesChanged_event = TestHelpersJS.ENSToken.DelegateVotesChanged.createMockEvent as any;

export const Addresses: { mockAddresses: Address_t[]; defaultAddress: Address_t } = TestHelpersJS.Addresses as any;

export const ENSGovernor: {
  VoteCast: {
    processEvent: EventFunctions_eventProcessor<Types_ENSGovernor_VoteCast_event>; 
    createMockEvent: (args:ENSGovernor_VoteCast_createMockArgs) => Types_ENSGovernor_VoteCast_event
  }; 
  ProposalQueued: {
    processEvent: EventFunctions_eventProcessor<Types_ENSGovernor_ProposalQueued_event>; 
    createMockEvent: (args:ENSGovernor_ProposalQueued_createMockArgs) => Types_ENSGovernor_ProposalQueued_event
  }; 
  ProposalCreated: {
    processEvent: EventFunctions_eventProcessor<Types_ENSGovernor_ProposalCreated_event>; 
    createMockEvent: (args:ENSGovernor_ProposalCreated_createMockArgs) => Types_ENSGovernor_ProposalCreated_event
  }; 
  ProposalCanceled: {
    processEvent: EventFunctions_eventProcessor<Types_ENSGovernor_ProposalCanceled_event>; 
    createMockEvent: (args:ENSGovernor_ProposalCanceled_createMockArgs) => Types_ENSGovernor_ProposalCanceled_event
  }; 
  ProposalExecuted: {
    processEvent: EventFunctions_eventProcessor<Types_ENSGovernor_ProposalExecuted_event>; 
    createMockEvent: (args:ENSGovernor_ProposalExecuted_createMockArgs) => Types_ENSGovernor_ProposalExecuted_event
  }
} = TestHelpersJS.ENSGovernor as any;

export const MockDb: { createMockDb: () => TestHelpers_MockDb_t } = TestHelpersJS.MockDb as any;

export const ENSToken: {
  Transfer: {
    processEvent: EventFunctions_eventProcessor<Types_ENSToken_Transfer_event>; 
    createMockEvent: (args:ENSToken_Transfer_createMockArgs) => Types_ENSToken_Transfer_event
  }; 
  DelegateChanged: {
    processEvent: EventFunctions_eventProcessor<Types_ENSToken_DelegateChanged_event>; 
    createMockEvent: (args:ENSToken_DelegateChanged_createMockArgs) => Types_ENSToken_DelegateChanged_event
  }; 
  DelegateVotesChanged: {
    processEvent: EventFunctions_eventProcessor<Types_ENSToken_DelegateVotesChanged_event>; 
    createMockEvent: (args:ENSToken_DelegateVotesChanged_createMockArgs) => Types_ENSToken_DelegateVotesChanged_event
  }
} = TestHelpersJS.ENSToken as any;
