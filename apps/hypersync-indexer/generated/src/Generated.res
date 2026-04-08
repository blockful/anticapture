@val external require: string => unit = "require"

let registerContractHandlers = (
  ~contractName,
  ~handlerPathRelativeToRoot,
  ~handlerPathRelativeToConfig,
) => {
  try {
    require(`../${Path.relativePathToRootFromGenerated}/${handlerPathRelativeToRoot}`)
  } catch {
  | exn =>
    let params = {
      "Contract Name": contractName,
      "Expected Handler Path": handlerPathRelativeToConfig,
      "Code": "EE500",
    }
    let logger = Logging.createChild(~params)

    let errHandler = exn->ErrorHandling.make(~msg="Failed to import handler file", ~logger)
    errHandler->ErrorHandling.log
    errHandler->ErrorHandling.raiseExn
  }
}

let makeGeneratedConfig = () => {
  let chains = [
    {
      let contracts = [
        {
          Config.name: "ENSToken",
          abi: Types.ENSToken.abi,
          addresses: [
            "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72"->Address.Evm.fromStringOrThrow
,
          ],
          events: [
            (Types.ENSToken.Transfer.register() :> Internal.eventConfig),
            (Types.ENSToken.DelegateChanged.register() :> Internal.eventConfig),
            (Types.ENSToken.DelegateVotesChanged.register() :> Internal.eventConfig),
          ],
          startBlock: None,
        },
        {
          Config.name: "ENSGovernor",
          abi: Types.ENSGovernor.abi,
          addresses: [
            "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3"->Address.Evm.fromStringOrThrow
,
          ],
          events: [
            (Types.ENSGovernor.ProposalCreated.register() :> Internal.eventConfig),
            (Types.ENSGovernor.VoteCast.register() :> Internal.eventConfig),
            (Types.ENSGovernor.ProposalCanceled.register() :> Internal.eventConfig),
            (Types.ENSGovernor.ProposalExecuted.register() :> Internal.eventConfig),
            (Types.ENSGovernor.ProposalQueued.register() :> Internal.eventConfig),
          ],
          startBlock: Some(13533772),
        },
      ]
      let chain = ChainMap.Chain.makeUnsafe(~chainId=1)
      {
        Config.maxReorgDepth: 200,
        startBlock: 9380410,
        id: 1,
        contracts,
        sources: NetworkSources.evm(~chain, ~contracts=[{name: "ENSToken",events: [Types.ENSToken.Transfer.register(), Types.ENSToken.DelegateChanged.register(), Types.ENSToken.DelegateVotesChanged.register()],abi: Types.ENSToken.abi}, {name: "ENSGovernor",events: [Types.ENSGovernor.ProposalCreated.register(), Types.ENSGovernor.VoteCast.register(), Types.ENSGovernor.ProposalCanceled.register(), Types.ENSGovernor.ProposalExecuted.register(), Types.ENSGovernor.ProposalQueued.register()],abi: Types.ENSGovernor.abi}], ~hyperSync=Some("https://eth.hypersync.xyz"), ~allEventSignatures=[Types.ENSToken.eventSignatures, Types.ENSGovernor.eventSignatures]->Belt.Array.concatMany, ~shouldUseHypersyncClientDecoder=true, ~rpcs=[], ~lowercaseAddresses=false)
      }
    },
  ]

  Config.make(
    ~shouldRollbackOnReorg=true,
    ~shouldSaveFullHistory=false,
    ~multichain=if (
      Env.Configurable.isUnorderedMultichainMode->Belt.Option.getWithDefault(
        Env.Configurable.unstable__temp_unordered_head_mode->Belt.Option.getWithDefault(
          false,
        ),
      )
    ) {
      Unordered
    } else {
      Ordered
    },
    ~chains,
    ~enableRawEvents=false,
    ~batchSize=?Env.batchSize,
    ~preloadHandlers=false,
    ~lowercaseAddresses=false,
    ~shouldUseHypersyncClientDecoder=true,
  )
}

let configWithoutRegistrations = makeGeneratedConfig()

let registerAllHandlers = () => {
  EventRegister.startRegistration(
    ~ecosystem=configWithoutRegistrations.ecosystem,
    ~multichain=configWithoutRegistrations.multichain,
    ~preloadHandlers=configWithoutRegistrations.preloadHandlers,
  )

  registerContractHandlers(
    ~contractName="ENSGovernor",
    ~handlerPathRelativeToRoot="src/eventHandlers/ENSGovernor.ts",
    ~handlerPathRelativeToConfig="src/eventHandlers/ENSGovernor.ts",
  )
  registerContractHandlers(
    ~contractName="ENSToken",
    ~handlerPathRelativeToRoot="src/eventHandlers/ENSToken.ts",
    ~handlerPathRelativeToConfig="src/eventHandlers/ENSToken.ts",
  )

  EventRegister.finishRegistration()
}

let initialSql = Db.makeClient()
let storagePgSchema = Env.Db.publicSchema
let makeStorage = (~sql, ~pgSchema=storagePgSchema, ~isHasuraEnabled=Env.Hasura.enabled) => {
  PgStorage.make(
    ~sql,
    ~pgSchema,
    ~pgHost=Env.Db.host,
    ~pgUser=Env.Db.user,
    ~pgPort=Env.Db.port,
    ~pgDatabase=Env.Db.database,
    ~pgPassword=Env.Db.password,
    ~onInitialize=?{
      if isHasuraEnabled {
        Some(
          () => {
            Hasura.trackDatabase(
              ~endpoint=Env.Hasura.graphqlEndpoint,
              ~auth={
                role: Env.Hasura.role,
                secret: Env.Hasura.secret,
              },
              ~pgSchema=storagePgSchema,
              ~userEntities=Entities.userEntities,
              ~responseLimit=Env.Hasura.responseLimit,
              ~schema=Db.schema,
              ~aggregateEntities=Env.Hasura.aggregateEntities,
            )->Promise.catch(err => {
              Logging.errorWithExn(
                err->Utils.prettifyExn,
                `EE803: Error tracking tables`,
              )->Promise.resolve
            })
          },
        )
      } else {
        None
      }
    },
    ~onNewTables=?{
      if isHasuraEnabled {
        Some(
          (~tableNames) => {
            Hasura.trackTables(
              ~endpoint=Env.Hasura.graphqlEndpoint,
              ~auth={
                role: Env.Hasura.role,
                secret: Env.Hasura.secret,
              },
              ~pgSchema=storagePgSchema,
              ~tableNames,
            )->Promise.catch(err => {
              Logging.errorWithExn(
                err->Utils.prettifyExn,
                `EE804: Error tracking new tables`,
              )->Promise.resolve
            })
          },
        )
      } else {
        None
      }
    },
    ~isHasuraEnabled,
  )
}

let codegenPersistence = Persistence.make(
  ~userEntities=Entities.userEntities,
  ~allEnums=Enums.allEnums,
  ~storage=makeStorage(~sql=initialSql),
  ~sql=initialSql,
)

%%private(let indexer: ref<option<Indexer.t>> = ref(None))
let getIndexer = () => {
  switch indexer.contents {
  | Some(indexer) => indexer
  | None =>
    let i = {
      Indexer.registrations: registerAllHandlers(),
      // Need to recreate initial config one more time,
      // since configWithoutRegistrations called register for event
      // before they were ready
      config: makeGeneratedConfig(),
      persistence: codegenPersistence,
    }
    indexer := Some(i)
    i
  }
}
