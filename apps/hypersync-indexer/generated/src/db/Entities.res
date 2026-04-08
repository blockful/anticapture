open Table
open Enums.EntityType
type id = string

type internalEntity = Internal.entity
module type Entity = {
  type t
  let index: int
  let name: string
  let schema: S.t<t>
  let rowsSchema: S.t<array<t>>
  let table: Table.table
  let entityHistory: EntityHistory.t<t>
}
external entityModToInternal: module(Entity with type t = 'a) => Internal.entityConfig = "%identity"
external entityModsToInternal: array<module(Entity)> => array<Internal.entityConfig> = "%identity"
external entitiesToInternal: array<'a> => array<Internal.entity> = "%identity"

@get
external getEntityId: internalEntity => string = "id"

// Use InMemoryTable.Entity.getEntityIdUnsafe instead of duplicating the logic
let getEntityIdUnsafe = InMemoryTable.Entity.getEntityIdUnsafe

//shorthand for punning
let isPrimaryKey = true
let isNullable = true
let isArray = true
let isIndex = true

@genType
type whereOperations<'entity, 'fieldType> = {
  eq: 'fieldType => promise<array<'entity>>,
  gt: 'fieldType => promise<array<'entity>>,
  lt: 'fieldType => promise<array<'entity>>
}

module Account = {
  let name = (Account :> string)
  let index = 0
  @genType
  type t = {
    id: id,
  }

  let schema = S.object((s): t => {
    id: s.field("id", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module AccountBalance = {
  let name = (AccountBalance :> string)
  let index = 1
  @genType
  type t = {
    accountId: string,
    balance: bigint,
    delegate: string,
    id: id,
    tokenId: string,
  }

  let schema = S.object((s): t => {
    accountId: s.field("accountId", S.string),
    balance: s.field("balance", BigInt.schema),
    delegate: s.field("delegate", S.string),
    id: s.field("id", S.string),
    tokenId: s.field("tokenId", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("accountId") accountId: whereOperations<t, string>,
    
      @as("tokenId") tokenId: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "accountId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "balance", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "delegate", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "tokenId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module AccountPower = {
  let name = (AccountPower :> string)
  let index = 2
  @genType
  type t = {
    accountId: string,
    daoId: string,
    delegationsCount: int,
    id: id,
    lastVoteTimestamp: bigint,
    proposalsCount: int,
    votesCount: int,
    votingPower: bigint,
  }

  let schema = S.object((s): t => {
    accountId: s.field("accountId", S.string),
    daoId: s.field("daoId", S.string),
    delegationsCount: s.field("delegationsCount", S.int),
    id: s.field("id", S.string),
    lastVoteTimestamp: s.field("lastVoteTimestamp", BigInt.schema),
    proposalsCount: s.field("proposalsCount", S.int),
    votesCount: s.field("votesCount", S.int),
    votingPower: s.field("votingPower", BigInt.schema),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("accountId") accountId: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "accountId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "daoId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "delegationsCount", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "lastVoteTimestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "proposalsCount", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "votesCount", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "votingPower", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module BalanceHistory = {
  let name = (BalanceHistory :> string)
  let index = 3
  @genType
  type t = {
    accountId: string,
    balance: bigint,
    daoId: string,
    delta: bigint,
    deltaMod: bigint,
    id: id,
    logIndex: int,
    timestamp: bigint,
    transactionHash: string,
  }

  let schema = S.object((s): t => {
    accountId: s.field("accountId", S.string),
    balance: s.field("balance", BigInt.schema),
    daoId: s.field("daoId", S.string),
    delta: s.field("delta", BigInt.schema),
    deltaMod: s.field("deltaMod", BigInt.schema),
    id: s.field("id", S.string),
    logIndex: s.field("logIndex", S.int),
    timestamp: s.field("timestamp", BigInt.schema),
    transactionHash: s.field("transactionHash", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("accountId") accountId: whereOperations<t, string>,
    
      @as("transactionHash") transactionHash: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "accountId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "balance", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "daoId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "delta", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "deltaMod", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "logIndex", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "transactionHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module DaoMetricsDayBucket = {
  let name = (DaoMetricsDayBucket :> string)
  let index = 4
  @genType
  type t = {
    average: bigint,
    closeValue: bigint,
    count: int,
    daoId: string,
    date: bigint,
    high: bigint,
    id: id,
    lastUpdate: bigint,
    low: bigint,
    metricType: Enums.MetricType.t,
    openValue: bigint,
    tokenId: string,
    volume: bigint,
  }

  let schema = S.object((s): t => {
    average: s.field("average", BigInt.schema),
    closeValue: s.field("closeValue", BigInt.schema),
    count: s.field("count", S.int),
    daoId: s.field("daoId", S.string),
    date: s.field("date", BigInt.schema),
    high: s.field("high", BigInt.schema),
    id: s.field("id", S.string),
    lastUpdate: s.field("lastUpdate", BigInt.schema),
    low: s.field("low", BigInt.schema),
    metricType: s.field("metricType", Enums.MetricType.config.schema),
    openValue: s.field("openValue", BigInt.schema),
    tokenId: s.field("tokenId", S.string),
    volume: s.field("volume", BigInt.schema),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("tokenId") tokenId: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "average", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "closeValue", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "count", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "daoId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "date", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "high", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "lastUpdate", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "low", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "metricType", 
      Custom(Enums.MetricType.config.name),
      ~fieldSchema=Enums.MetricType.config.schema,
      
      
      
      
      
      ),
      mkField(
      "openValue", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "tokenId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "volume", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module Delegation = {
  let name = (Delegation :> string)
  let index = 5
  @genType
  type t = {
    daoId: string,
    delegateAccountId: string,
    delegatedValue: bigint,
    delegationType: option<int>,
    delegatorAccountId: string,
    id: id,
    isCex: bool,
    isDex: bool,
    isLending: bool,
    isTotal: bool,
    logIndex: int,
    previousDelegate: option<string>,
    timestamp: bigint,
    transactionHash: string,
  }

  let schema = S.object((s): t => {
    daoId: s.field("daoId", S.string),
    delegateAccountId: s.field("delegateAccountId", S.string),
    delegatedValue: s.field("delegatedValue", BigInt.schema),
    delegationType: s.field("delegationType", S.null(S.int)),
    delegatorAccountId: s.field("delegatorAccountId", S.string),
    id: s.field("id", S.string),
    isCex: s.field("isCex", S.bool),
    isDex: s.field("isDex", S.bool),
    isLending: s.field("isLending", S.bool),
    isTotal: s.field("isTotal", S.bool),
    logIndex: s.field("logIndex", S.int),
    previousDelegate: s.field("previousDelegate", S.null(S.string)),
    timestamp: s.field("timestamp", BigInt.schema),
    transactionHash: s.field("transactionHash", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("delegateAccountId") delegateAccountId: whereOperations<t, string>,
    
      @as("delegatorAccountId") delegatorAccountId: whereOperations<t, string>,
    
      @as("timestamp") timestamp: whereOperations<t, bigint>,
    
      @as("transactionHash") transactionHash: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "daoId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "delegateAccountId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "delegatedValue", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "delegationType", 
      Integer,
      ~fieldSchema=S.null(S.int),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "delegatorAccountId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "isCex", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "isDex", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "isLending", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "isTotal", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "logIndex", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "previousDelegate", 
      Text,
      ~fieldSchema=S.null(S.string),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "transactionHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module FeedEvent = {
  let name = (FeedEvent :> string)
  let index = 6
  @genType
  type t = {
    eventType: Enums.EventType.t,
    id: id,
    logIndex: int,
    metadata: option<Js.Json.t>,
    timestamp: bigint,
    txHash: string,
    value: bigint,
  }

  let schema = S.object((s): t => {
    eventType: s.field("eventType", Enums.EventType.config.schema),
    id: s.field("id", S.string),
    logIndex: s.field("logIndex", S.int),
    metadata: s.field("metadata", S.null(S.json(~validate=false))),
    timestamp: s.field("timestamp", BigInt.schema),
    txHash: s.field("txHash", S.string),
    value: s.field("value", BigInt.schema),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("timestamp") timestamp: whereOperations<t, bigint>,
    
      @as("txHash") txHash: whereOperations<t, string>,
    
      @as("value") value: whereOperations<t, bigint>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "eventType", 
      Custom(Enums.EventType.config.name),
      ~fieldSchema=Enums.EventType.config.schema,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "logIndex", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "metadata", 
      JsonB,
      ~fieldSchema=S.null(S.json(~validate=false)),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "txHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "value", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      ~isIndex,
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module ProposalOnchain = {
  let name = (ProposalOnchain :> string)
  let index = 7
  @genType
  type t = {
    abstainVotes: bigint,
    againstVotes: bigint,
    calldatas: Js.Json.t,
    daoId: string,
    description: string,
    endBlock: int,
    endTimestamp: bigint,
    forVotes: bigint,
    id: id,
    logIndex: int,
    proposalType: option<int>,
    proposerAccountId: string,
    signatures: Js.Json.t,
    startBlock: int,
    status: string,
    targets: Js.Json.t,
    timestamp: bigint,
    title: string,
    txHash: string,
    values: Js.Json.t,
  }

  let schema = S.object((s): t => {
    abstainVotes: s.field("abstainVotes", BigInt.schema),
    againstVotes: s.field("againstVotes", BigInt.schema),
    calldatas: s.field("calldatas", S.json(~validate=false)),
    daoId: s.field("daoId", S.string),
    description: s.field("description", S.string),
    endBlock: s.field("endBlock", S.int),
    endTimestamp: s.field("endTimestamp", BigInt.schema),
    forVotes: s.field("forVotes", BigInt.schema),
    id: s.field("id", S.string),
    logIndex: s.field("logIndex", S.int),
    proposalType: s.field("proposalType", S.null(S.int)),
    proposerAccountId: s.field("proposerAccountId", S.string),
    signatures: s.field("signatures", S.json(~validate=false)),
    startBlock: s.field("startBlock", S.int),
    status: s.field("status", S.string),
    targets: s.field("targets", S.json(~validate=false)),
    timestamp: s.field("timestamp", BigInt.schema),
    title: s.field("title", S.string),
    txHash: s.field("txHash", S.string),
    values: s.field("values", S.json(~validate=false)),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("proposerAccountId") proposerAccountId: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "abstainVotes", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "againstVotes", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "calldatas", 
      JsonB,
      ~fieldSchema=S.json(~validate=false),
      
      
      
      
      
      ),
      mkField(
      "daoId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "description", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "endBlock", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "endTimestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "forVotes", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "logIndex", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "proposalType", 
      Integer,
      ~fieldSchema=S.null(S.int),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "proposerAccountId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "signatures", 
      JsonB,
      ~fieldSchema=S.json(~validate=false),
      
      
      
      
      
      ),
      mkField(
      "startBlock", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "status", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "targets", 
      JsonB,
      ~fieldSchema=S.json(~validate=false),
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "title", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "txHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "values", 
      JsonB,
      ~fieldSchema=S.json(~validate=false),
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module Token = {
  let name = (Token :> string)
  let index = 8
  @genType
  type t = {
    cexSupply: bigint,
    circulatingSupply: bigint,
    decimals: int,
    delegatedSupply: bigint,
    dexSupply: bigint,
    id: id,
    lendingSupply: bigint,
    name: option<string>,
    nonCirculatingSupply: bigint,
    totalSupply: bigint,
    treasury: bigint,
  }

  let schema = S.object((s): t => {
    cexSupply: s.field("cexSupply", BigInt.schema),
    circulatingSupply: s.field("circulatingSupply", BigInt.schema),
    decimals: s.field("decimals", S.int),
    delegatedSupply: s.field("delegatedSupply", BigInt.schema),
    dexSupply: s.field("dexSupply", BigInt.schema),
    id: s.field("id", S.string),
    lendingSupply: s.field("lendingSupply", BigInt.schema),
    name: s.field("name", S.null(S.string)),
    nonCirculatingSupply: s.field("nonCirculatingSupply", BigInt.schema),
    totalSupply: s.field("totalSupply", BigInt.schema),
    treasury: s.field("treasury", BigInt.schema),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "cexSupply", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "circulatingSupply", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "decimals", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "delegatedSupply", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "dexSupply", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "lendingSupply", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "name", 
      Text,
      ~fieldSchema=S.null(S.string),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "nonCirculatingSupply", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "totalSupply", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "treasury", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module TokenPrice = {
  let name = (TokenPrice :> string)
  let index = 9
  @genType
  type t = {
    id: id,
    price: bigint,
    timestamp: bigint,
  }

  let schema = S.object((s): t => {
    id: s.field("id", S.string),
    price: s.field("price", BigInt.schema),
    timestamp: s.field("timestamp", BigInt.schema),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "price", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module Transaction = {
  let name = (Transaction :> string)
  let index = 10
  @genType
  type t = {
    fromAddress: option<string>,
    id: id,
    isCex: bool,
    isDex: bool,
    isLending: bool,
    isTotal: bool,
    timestamp: bigint,
    toAddress: option<string>,
    transactionHash: string,
  }

  let schema = S.object((s): t => {
    fromAddress: s.field("fromAddress", S.null(S.string)),
    id: s.field("id", S.string),
    isCex: s.field("isCex", S.bool),
    isDex: s.field("isDex", S.bool),
    isLending: s.field("isLending", S.bool),
    isTotal: s.field("isTotal", S.bool),
    timestamp: s.field("timestamp", BigInt.schema),
    toAddress: s.field("toAddress", S.null(S.string)),
    transactionHash: s.field("transactionHash", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "fromAddress", 
      Text,
      ~fieldSchema=S.null(S.string),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "isCex", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "isDex", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "isLending", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "isTotal", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "toAddress", 
      Text,
      ~fieldSchema=S.null(S.string),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "transactionHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module Transfer = {
  let name = (Transfer :> string)
  let index = 11
  @genType
  type t = {
    amount: bigint,
    daoId: string,
    fromAccountId: string,
    id: id,
    isCex: bool,
    isDex: bool,
    isLending: bool,
    isTotal: bool,
    logIndex: int,
    timestamp: bigint,
    toAccountId: string,
    tokenId: string,
    transactionHash: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    daoId: s.field("daoId", S.string),
    fromAccountId: s.field("fromAccountId", S.string),
    id: s.field("id", S.string),
    isCex: s.field("isCex", S.bool),
    isDex: s.field("isDex", S.bool),
    isLending: s.field("isLending", S.bool),
    isTotal: s.field("isTotal", S.bool),
    logIndex: s.field("logIndex", S.int),
    timestamp: s.field("timestamp", BigInt.schema),
    toAccountId: s.field("toAccountId", S.string),
    tokenId: s.field("tokenId", S.string),
    transactionHash: s.field("transactionHash", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("amount") amount: whereOperations<t, bigint>,
    
      @as("fromAccountId") fromAccountId: whereOperations<t, string>,
    
      @as("timestamp") timestamp: whereOperations<t, bigint>,
    
      @as("toAccountId") toAccountId: whereOperations<t, string>,
    
      @as("tokenId") tokenId: whereOperations<t, string>,
    
      @as("transactionHash") transactionHash: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "daoId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "fromAccountId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "isCex", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "isDex", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "isLending", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "isTotal", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "logIndex", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "toAccountId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "tokenId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "transactionHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module VoteOnchain = {
  let name = (VoteOnchain :> string)
  let index = 12
  @genType
  type t = {
    daoId: string,
    id: id,
    proposalId: string,
    reason: option<string>,
    support: string,
    timestamp: bigint,
    txHash: string,
    voterAccountId: string,
    votingPower: bigint,
  }

  let schema = S.object((s): t => {
    daoId: s.field("daoId", S.string),
    id: s.field("id", S.string),
    proposalId: s.field("proposalId", S.string),
    reason: s.field("reason", S.null(S.string)),
    support: s.field("support", S.string),
    timestamp: s.field("timestamp", BigInt.schema),
    txHash: s.field("txHash", S.string),
    voterAccountId: s.field("voterAccountId", S.string),
    votingPower: s.field("votingPower", BigInt.schema),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("proposalId") proposalId: whereOperations<t, string>,
    
      @as("voterAccountId") voterAccountId: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "daoId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "proposalId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "reason", 
      Text,
      ~fieldSchema=S.null(S.string),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "support", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "txHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "voterAccountId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "votingPower", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module VotingPowerHistory = {
  let name = (VotingPowerHistory :> string)
  let index = 13
  @genType
  type t = {
    accountId: string,
    daoId: string,
    delta: bigint,
    deltaMod: bigint,
    id: id,
    logIndex: int,
    timestamp: bigint,
    transactionHash: string,
    votingPower: bigint,
  }

  let schema = S.object((s): t => {
    accountId: s.field("accountId", S.string),
    daoId: s.field("daoId", S.string),
    delta: s.field("delta", BigInt.schema),
    deltaMod: s.field("deltaMod", BigInt.schema),
    id: s.field("id", S.string),
    logIndex: s.field("logIndex", S.int),
    timestamp: s.field("timestamp", BigInt.schema),
    transactionHash: s.field("transactionHash", S.string),
    votingPower: s.field("votingPower", BigInt.schema),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("accountId") accountId: whereOperations<t, string>,
    
      @as("transactionHash") transactionHash: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "accountId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "daoId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "delta", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "deltaMod", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "logIndex", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "transactionHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "votingPower", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

let userEntities = [
  module(Account),
  module(AccountBalance),
  module(AccountPower),
  module(BalanceHistory),
  module(DaoMetricsDayBucket),
  module(Delegation),
  module(FeedEvent),
  module(ProposalOnchain),
  module(Token),
  module(TokenPrice),
  module(Transaction),
  module(Transfer),
  module(VoteOnchain),
  module(VotingPowerHistory),
]->entityModsToInternal

let allEntities =
  userEntities->Js.Array2.concat(
    [module(InternalTable.DynamicContractRegistry)]->entityModsToInternal,
  )

let byName =
  allEntities
  ->Js.Array2.map(entityConfig => {
    (entityConfig.name, entityConfig)
  })
  ->Js.Dict.fromArray
