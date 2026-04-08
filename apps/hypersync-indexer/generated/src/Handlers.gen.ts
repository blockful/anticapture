/* TypeScript file generated from Handlers.res by genType. */

/* eslint-disable */
/* tslint:disable */

const HandlersJS = require('./Handlers.res.js');

import type {ENSGovernor_ProposalCanceled_eventFilters as Types_ENSGovernor_ProposalCanceled_eventFilters} from './Types.gen';

import type {ENSGovernor_ProposalCanceled_event as Types_ENSGovernor_ProposalCanceled_event} from './Types.gen';

import type {ENSGovernor_ProposalCreated_eventFilters as Types_ENSGovernor_ProposalCreated_eventFilters} from './Types.gen';

import type {ENSGovernor_ProposalCreated_event as Types_ENSGovernor_ProposalCreated_event} from './Types.gen';

import type {ENSGovernor_ProposalExecuted_eventFilters as Types_ENSGovernor_ProposalExecuted_eventFilters} from './Types.gen';

import type {ENSGovernor_ProposalExecuted_event as Types_ENSGovernor_ProposalExecuted_event} from './Types.gen';

import type {ENSGovernor_ProposalQueued_eventFilters as Types_ENSGovernor_ProposalQueued_eventFilters} from './Types.gen';

import type {ENSGovernor_ProposalQueued_event as Types_ENSGovernor_ProposalQueued_event} from './Types.gen';

import type {ENSGovernor_VoteCast_eventFilters as Types_ENSGovernor_VoteCast_eventFilters} from './Types.gen';

import type {ENSGovernor_VoteCast_event as Types_ENSGovernor_VoteCast_event} from './Types.gen';

import type {ENSToken_DelegateChanged_eventFilters as Types_ENSToken_DelegateChanged_eventFilters} from './Types.gen';

import type {ENSToken_DelegateChanged_event as Types_ENSToken_DelegateChanged_event} from './Types.gen';

import type {ENSToken_DelegateVotesChanged_eventFilters as Types_ENSToken_DelegateVotesChanged_eventFilters} from './Types.gen';

import type {ENSToken_DelegateVotesChanged_event as Types_ENSToken_DelegateVotesChanged_event} from './Types.gen';

import type {ENSToken_Transfer_eventFilters as Types_ENSToken_Transfer_eventFilters} from './Types.gen';

import type {ENSToken_Transfer_event as Types_ENSToken_Transfer_event} from './Types.gen';

import type {HandlerTypes_eventConfig as Types_HandlerTypes_eventConfig} from './Types.gen';

import type {chain as Types_chain} from './Types.gen';

import type {contractRegistrations as Types_contractRegistrations} from './Types.gen';

import type {fnWithEventConfig as Types_fnWithEventConfig} from './Types.gen';

import type {genericContractRegisterArgs as Internal_genericContractRegisterArgs} from 'envio/src/Internal.gen';

import type {genericContractRegister as Internal_genericContractRegister} from 'envio/src/Internal.gen';

import type {genericHandlerArgs as Internal_genericHandlerArgs} from 'envio/src/Internal.gen';

import type {genericHandlerWithLoader as Internal_genericHandlerWithLoader} from 'envio/src/Internal.gen';

import type {genericHandler as Internal_genericHandler} from 'envio/src/Internal.gen';

import type {genericLoaderArgs as Internal_genericLoaderArgs} from 'envio/src/Internal.gen';

import type {genericLoader as Internal_genericLoader} from 'envio/src/Internal.gen';

import type {handlerContext as Types_handlerContext} from './Types.gen';

import type {loaderContext as Types_loaderContext} from './Types.gen';

import type {onBlockArgs as Envio_onBlockArgs} from 'envio/src/Envio.gen';

import type {onBlockOptions as Envio_onBlockOptions} from 'envio/src/Envio.gen';

export const ENSGovernor_ProposalCreated_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSGovernor_ProposalCreated_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalCreated_eventFilters>> = HandlersJS.ENSGovernor.ProposalCreated.contractRegister as any;

export const ENSGovernor_ProposalCreated_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalCreated_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalCreated_eventFilters>> = HandlersJS.ENSGovernor.ProposalCreated.handler as any;

export const ENSGovernor_ProposalCreated_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSGovernor_ProposalCreated_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalCreated_event,Types_handlerContext,loaderReturn>>,Types_ENSGovernor_ProposalCreated_eventFilters>) => void = HandlersJS.ENSGovernor.ProposalCreated.handlerWithLoader as any;

export const ENSGovernor_VoteCast_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSGovernor_VoteCast_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_VoteCast_eventFilters>> = HandlersJS.ENSGovernor.VoteCast.contractRegister as any;

export const ENSGovernor_VoteCast_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_VoteCast_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_VoteCast_eventFilters>> = HandlersJS.ENSGovernor.VoteCast.handler as any;

export const ENSGovernor_VoteCast_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSGovernor_VoteCast_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_VoteCast_event,Types_handlerContext,loaderReturn>>,Types_ENSGovernor_VoteCast_eventFilters>) => void = HandlersJS.ENSGovernor.VoteCast.handlerWithLoader as any;

export const ENSGovernor_ProposalCanceled_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSGovernor_ProposalCanceled_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalCanceled_eventFilters>> = HandlersJS.ENSGovernor.ProposalCanceled.contractRegister as any;

export const ENSGovernor_ProposalCanceled_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalCanceled_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalCanceled_eventFilters>> = HandlersJS.ENSGovernor.ProposalCanceled.handler as any;

export const ENSGovernor_ProposalCanceled_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSGovernor_ProposalCanceled_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalCanceled_event,Types_handlerContext,loaderReturn>>,Types_ENSGovernor_ProposalCanceled_eventFilters>) => void = HandlersJS.ENSGovernor.ProposalCanceled.handlerWithLoader as any;

export const ENSGovernor_ProposalExecuted_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSGovernor_ProposalExecuted_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalExecuted_eventFilters>> = HandlersJS.ENSGovernor.ProposalExecuted.contractRegister as any;

export const ENSGovernor_ProposalExecuted_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalExecuted_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalExecuted_eventFilters>> = HandlersJS.ENSGovernor.ProposalExecuted.handler as any;

export const ENSGovernor_ProposalExecuted_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSGovernor_ProposalExecuted_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalExecuted_event,Types_handlerContext,loaderReturn>>,Types_ENSGovernor_ProposalExecuted_eventFilters>) => void = HandlersJS.ENSGovernor.ProposalExecuted.handlerWithLoader as any;

export const ENSGovernor_ProposalQueued_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSGovernor_ProposalQueued_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalQueued_eventFilters>> = HandlersJS.ENSGovernor.ProposalQueued.contractRegister as any;

export const ENSGovernor_ProposalQueued_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalQueued_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalQueued_eventFilters>> = HandlersJS.ENSGovernor.ProposalQueued.handler as any;

export const ENSGovernor_ProposalQueued_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSGovernor_ProposalQueued_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalQueued_event,Types_handlerContext,loaderReturn>>,Types_ENSGovernor_ProposalQueued_eventFilters>) => void = HandlersJS.ENSGovernor.ProposalQueued.handlerWithLoader as any;

export const ENSToken_Transfer_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSToken_Transfer_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSToken_Transfer_eventFilters>> = HandlersJS.ENSToken.Transfer.contractRegister as any;

export const ENSToken_Transfer_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSToken_Transfer_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSToken_Transfer_eventFilters>> = HandlersJS.ENSToken.Transfer.handler as any;

export const ENSToken_Transfer_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSToken_Transfer_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSToken_Transfer_event,Types_handlerContext,loaderReturn>>,Types_ENSToken_Transfer_eventFilters>) => void = HandlersJS.ENSToken.Transfer.handlerWithLoader as any;

export const ENSToken_DelegateChanged_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSToken_DelegateChanged_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSToken_DelegateChanged_eventFilters>> = HandlersJS.ENSToken.DelegateChanged.contractRegister as any;

export const ENSToken_DelegateChanged_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSToken_DelegateChanged_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSToken_DelegateChanged_eventFilters>> = HandlersJS.ENSToken.DelegateChanged.handler as any;

export const ENSToken_DelegateChanged_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSToken_DelegateChanged_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSToken_DelegateChanged_event,Types_handlerContext,loaderReturn>>,Types_ENSToken_DelegateChanged_eventFilters>) => void = HandlersJS.ENSToken.DelegateChanged.handlerWithLoader as any;

export const ENSToken_DelegateVotesChanged_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSToken_DelegateVotesChanged_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSToken_DelegateVotesChanged_eventFilters>> = HandlersJS.ENSToken.DelegateVotesChanged.contractRegister as any;

export const ENSToken_DelegateVotesChanged_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSToken_DelegateVotesChanged_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSToken_DelegateVotesChanged_eventFilters>> = HandlersJS.ENSToken.DelegateVotesChanged.handler as any;

export const ENSToken_DelegateVotesChanged_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSToken_DelegateVotesChanged_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSToken_DelegateVotesChanged_event,Types_handlerContext,loaderReturn>>,Types_ENSToken_DelegateVotesChanged_eventFilters>) => void = HandlersJS.ENSToken.DelegateVotesChanged.handlerWithLoader as any;

/** Register a Block Handler. It'll be called for every block by default. */
export const onBlock: (_1:Envio_onBlockOptions<Types_chain>, _2:((_1:Envio_onBlockArgs<Types_handlerContext>) => Promise<void>)) => void = HandlersJS.onBlock as any;

export const ENSGovernor: {
  VoteCast: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSGovernor_VoteCast_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_VoteCast_event,Types_handlerContext,loaderReturn>>,Types_ENSGovernor_VoteCast_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_VoteCast_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_VoteCast_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSGovernor_VoteCast_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_VoteCast_eventFilters>>
  }; 
  ProposalQueued: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSGovernor_ProposalQueued_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalQueued_event,Types_handlerContext,loaderReturn>>,Types_ENSGovernor_ProposalQueued_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalQueued_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalQueued_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSGovernor_ProposalQueued_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalQueued_eventFilters>>
  }; 
  ProposalCreated: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSGovernor_ProposalCreated_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalCreated_event,Types_handlerContext,loaderReturn>>,Types_ENSGovernor_ProposalCreated_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalCreated_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalCreated_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSGovernor_ProposalCreated_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalCreated_eventFilters>>
  }; 
  ProposalCanceled: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSGovernor_ProposalCanceled_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalCanceled_event,Types_handlerContext,loaderReturn>>,Types_ENSGovernor_ProposalCanceled_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalCanceled_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalCanceled_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSGovernor_ProposalCanceled_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalCanceled_eventFilters>>
  }; 
  ProposalExecuted: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSGovernor_ProposalExecuted_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalExecuted_event,Types_handlerContext,loaderReturn>>,Types_ENSGovernor_ProposalExecuted_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSGovernor_ProposalExecuted_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalExecuted_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSGovernor_ProposalExecuted_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSGovernor_ProposalExecuted_eventFilters>>
  }
} = HandlersJS.ENSGovernor as any;

export const ENSToken: {
  Transfer: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSToken_Transfer_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSToken_Transfer_event,Types_handlerContext,loaderReturn>>,Types_ENSToken_Transfer_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSToken_Transfer_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSToken_Transfer_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSToken_Transfer_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSToken_Transfer_eventFilters>>
  }; 
  DelegateChanged: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSToken_DelegateChanged_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSToken_DelegateChanged_event,Types_handlerContext,loaderReturn>>,Types_ENSToken_DelegateChanged_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSToken_DelegateChanged_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSToken_DelegateChanged_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSToken_DelegateChanged_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSToken_DelegateChanged_eventFilters>>
  }; 
  DelegateVotesChanged: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_ENSToken_DelegateVotesChanged_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSToken_DelegateVotesChanged_event,Types_handlerContext,loaderReturn>>,Types_ENSToken_DelegateVotesChanged_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_ENSToken_DelegateVotesChanged_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_ENSToken_DelegateVotesChanged_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_ENSToken_DelegateVotesChanged_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_ENSToken_DelegateVotesChanged_eventFilters>>
  }
} = HandlersJS.ENSToken as any;
