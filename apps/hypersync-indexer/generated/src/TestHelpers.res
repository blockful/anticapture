/***** TAKE NOTE ******
This is a hack to get genType to work!

In order for genType to produce recursive types, it needs to be at the 
root module of a file. If it's defined in a nested module it does not 
work. So all the MockDb types and internal functions are defined in TestHelpers_MockDb
and only public functions are recreated and exported from this module.

the following module:
```rescript
module MyModule = {
  @genType
  type rec a = {fieldB: b}
  @genType and b = {fieldA: a}
}
```

produces the following in ts:
```ts
// tslint:disable-next-line:interface-over-type-literal
export type MyModule_a = { readonly fieldB: b };

// tslint:disable-next-line:interface-over-type-literal
export type MyModule_b = { readonly fieldA: MyModule_a };
```

fieldB references type b which doesn't exist because it's defined
as MyModule_b
*/

module MockDb = {
  @genType
  let createMockDb = TestHelpers_MockDb.createMockDb
}

@genType
module Addresses = {
  include TestHelpers_MockAddresses
}

module EventFunctions = {
  //Note these are made into a record to make operate in the same way
  //for Res, JS and TS.

  /**
  The arguements that get passed to a "processEvent" helper function
  */
  @genType
  type eventProcessorArgs<'event> = {
    event: 'event,
    mockDb: TestHelpers_MockDb.t,
    @deprecated("Set the chainId for the event instead")
    chainId?: int,
  }

  @genType
  type eventProcessor<'event> = eventProcessorArgs<'event> => promise<TestHelpers_MockDb.t>

  /**
  A function composer to help create individual processEvent functions
  */
  let makeEventProcessor = (~register) => args => {
    let {event, mockDb, ?chainId} =
      args->(Utils.magic: eventProcessorArgs<'event> => eventProcessorArgs<Internal.event>)

    // Have the line here, just in case the function is called with
    // a manually created event. We don't want to break the existing tests here.
    let _ =
      TestHelpers_MockDb.mockEventRegisters->Utils.WeakMap.set(event, register)
    TestHelpers_MockDb.makeProcessEvents(mockDb, ~chainId=?chainId)([event->(Utils.magic: Internal.event => Types.eventLog<unknown>)])
  }

  module MockBlock = {
    @genType
    type t = {
      @as("hash") hash?: string,
      @as("number") number?: int,
      @as("timestamp") timestamp?: int,
    }

    let toBlock = (_mock: t) => {
      hash: _mock.hash->Belt.Option.getWithDefault("foo"),
      number: _mock.number->Belt.Option.getWithDefault(0),
      timestamp: _mock.timestamp->Belt.Option.getWithDefault(0),
    }->(Utils.magic: Types.AggregatedBlock.t => Internal.eventBlock)
  }

  module MockTransaction = {
    @genType
    type t = {
      @as("from") from?: option<Address.t>,
      @as("hash") hash?: string,
      @as("to") to?: option<Address.t>,
    }

    let toTransaction = (_mock: t) => {
      from: _mock.from->Belt.Option.getWithDefault(None),
      hash: _mock.hash->Belt.Option.getWithDefault("foo"),
      to: _mock.to->Belt.Option.getWithDefault(None),
    }->(Utils.magic: Types.AggregatedTransaction.t => Internal.eventTransaction)
  }

  @genType
  type mockEventData = {
    chainId?: int,
    srcAddress?: Address.t,
    logIndex?: int,
    block?: MockBlock.t,
    transaction?: MockTransaction.t,
  }

  /**
  Applies optional paramters with defaults for all common eventLog field
  */
  let makeEventMocker = (
    ~params: Internal.eventParams,
    ~mockEventData: option<mockEventData>,
    ~register: unit => Internal.eventConfig,
  ): Internal.event => {
    let {?block, ?transaction, ?srcAddress, ?chainId, ?logIndex} =
      mockEventData->Belt.Option.getWithDefault({})
    let block = block->Belt.Option.getWithDefault({})->MockBlock.toBlock
    let transaction = transaction->Belt.Option.getWithDefault({})->MockTransaction.toTransaction
    let event: Internal.event = {
      params,
      transaction,
      chainId: switch chainId {
      | Some(chainId) => chainId
      | None =>
        switch Generated.configWithoutRegistrations.defaultChain {
        | Some(chainConfig) => chainConfig.id
        | None =>
          Js.Exn.raiseError(
            "No default chain Id found, please add at least 1 chain to your config.yaml",
          )
        }
      },
      block,
      srcAddress: srcAddress->Belt.Option.getWithDefault(Addresses.defaultAddress),
      logIndex: logIndex->Belt.Option.getWithDefault(0),
    }
    // Since currently it's not possible to figure out the event config from the event
    // we store a reference to the register function by event in a weak map
    let _ = TestHelpers_MockDb.mockEventRegisters->Utils.WeakMap.set(event, register)
    event
  }
}


module ENSGovernor = {
  module ProposalCreated = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.ENSGovernor.ProposalCreated.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.ENSGovernor.ProposalCreated.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("proposalId")
      proposalId?: bigint,
      @as("proposer")
      proposer?: Address.t,
      @as("targets")
      targets?: array<Address.t>,
      @as("values")
      values?: array<bigint>,
      @as("signatures")
      signatures?: array<string>,
      @as("calldatas")
      calldatas?: array<string>,
      @as("startBlock")
      startBlock?: bigint,
      @as("endBlock")
      endBlock?: bigint,
      @as("description")
      description?: string,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?proposalId,
        ?proposer,
        ?targets,
        ?values,
        ?signatures,
        ?calldatas,
        ?startBlock,
        ?endBlock,
        ?description,
        ?mockEventData,
      } = args

      let params = 
      {
       proposalId: proposalId->Belt.Option.getWithDefault(0n),
       proposer: proposer->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       targets: targets->Belt.Option.getWithDefault([]),
       values: values->Belt.Option.getWithDefault([]),
       signatures: signatures->Belt.Option.getWithDefault([]),
       calldatas: calldatas->Belt.Option.getWithDefault([]),
       startBlock: startBlock->Belt.Option.getWithDefault(0n),
       endBlock: endBlock->Belt.Option.getWithDefault(0n),
       description: description->Belt.Option.getWithDefault("foo"),
      }
->(Utils.magic: Types.ENSGovernor.ProposalCreated.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.ENSGovernor.ProposalCreated.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.ENSGovernor.ProposalCreated.event)
    }
  }

  module VoteCast = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.ENSGovernor.VoteCast.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.ENSGovernor.VoteCast.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("voter")
      voter?: Address.t,
      @as("proposalId")
      proposalId?: bigint,
      @as("support")
      support?: bigint,
      @as("weight")
      weight?: bigint,
      @as("reason")
      reason?: string,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?voter,
        ?proposalId,
        ?support,
        ?weight,
        ?reason,
        ?mockEventData,
      } = args

      let params = 
      {
       voter: voter->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       proposalId: proposalId->Belt.Option.getWithDefault(0n),
       support: support->Belt.Option.getWithDefault(0n),
       weight: weight->Belt.Option.getWithDefault(0n),
       reason: reason->Belt.Option.getWithDefault("foo"),
      }
->(Utils.magic: Types.ENSGovernor.VoteCast.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.ENSGovernor.VoteCast.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.ENSGovernor.VoteCast.event)
    }
  }

  module ProposalCanceled = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.ENSGovernor.ProposalCanceled.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.ENSGovernor.ProposalCanceled.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("proposalId")
      proposalId?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?proposalId,
        ?mockEventData,
      } = args

      let params = 
      {
       proposalId: proposalId->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.ENSGovernor.ProposalCanceled.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.ENSGovernor.ProposalCanceled.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.ENSGovernor.ProposalCanceled.event)
    }
  }

  module ProposalExecuted = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.ENSGovernor.ProposalExecuted.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.ENSGovernor.ProposalExecuted.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("proposalId")
      proposalId?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?proposalId,
        ?mockEventData,
      } = args

      let params = 
      {
       proposalId: proposalId->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.ENSGovernor.ProposalExecuted.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.ENSGovernor.ProposalExecuted.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.ENSGovernor.ProposalExecuted.event)
    }
  }

  module ProposalQueued = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.ENSGovernor.ProposalQueued.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.ENSGovernor.ProposalQueued.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("proposalId")
      proposalId?: bigint,
      @as("eta")
      eta?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?proposalId,
        ?eta,
        ?mockEventData,
      } = args

      let params = 
      {
       proposalId: proposalId->Belt.Option.getWithDefault(0n),
       eta: eta->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.ENSGovernor.ProposalQueued.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.ENSGovernor.ProposalQueued.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.ENSGovernor.ProposalQueued.event)
    }
  }

}


module ENSToken = {
  module Transfer = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.ENSToken.Transfer.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.ENSToken.Transfer.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("from")
      from?: Address.t,
      @as("to")
      to?: Address.t,
      @as("value")
      value?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?from,
        ?to,
        ?value,
        ?mockEventData,
      } = args

      let params = 
      {
       from: from->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       to: to->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       value: value->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.ENSToken.Transfer.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.ENSToken.Transfer.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.ENSToken.Transfer.event)
    }
  }

  module DelegateChanged = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.ENSToken.DelegateChanged.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.ENSToken.DelegateChanged.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("delegator")
      delegator?: Address.t,
      @as("fromDelegate")
      fromDelegate?: Address.t,
      @as("toDelegate")
      toDelegate?: Address.t,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?delegator,
        ?fromDelegate,
        ?toDelegate,
        ?mockEventData,
      } = args

      let params = 
      {
       delegator: delegator->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       fromDelegate: fromDelegate->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       toDelegate: toDelegate->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
      }
->(Utils.magic: Types.ENSToken.DelegateChanged.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.ENSToken.DelegateChanged.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.ENSToken.DelegateChanged.event)
    }
  }

  module DelegateVotesChanged = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.ENSToken.DelegateVotesChanged.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.ENSToken.DelegateVotesChanged.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("delegate")
      delegate?: Address.t,
      @as("previousBalance")
      previousBalance?: bigint,
      @as("newBalance")
      newBalance?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?delegate,
        ?previousBalance,
        ?newBalance,
        ?mockEventData,
      } = args

      let params = 
      {
       delegate: delegate->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       previousBalance: previousBalance->Belt.Option.getWithDefault(0n),
       newBalance: newBalance->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.ENSToken.DelegateVotesChanged.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.ENSToken.DelegateVotesChanged.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.ENSToken.DelegateVotesChanged.event)
    }
  }

}

