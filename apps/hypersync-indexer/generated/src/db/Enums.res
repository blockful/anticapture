module ContractType = {
  @genType
  type t = 
    | @as("ENSGovernor") ENSGovernor
    | @as("ENSToken") ENSToken

  let name = "CONTRACT_TYPE"
  let variants = [
    ENSGovernor,
    ENSToken,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

module EntityType = {
  @genType
  type t = 
    | @as("Account") Account
    | @as("AccountBalance") AccountBalance
    | @as("AccountPower") AccountPower
    | @as("BalanceHistory") BalanceHistory
    | @as("DaoMetricsDayBucket") DaoMetricsDayBucket
    | @as("Delegation") Delegation
    | @as("FeedEvent") FeedEvent
    | @as("ProposalOnchain") ProposalOnchain
    | @as("Token") Token
    | @as("TokenPrice") TokenPrice
    | @as("Transaction") Transaction
    | @as("Transfer") Transfer
    | @as("VoteOnchain") VoteOnchain
    | @as("VotingPowerHistory") VotingPowerHistory
    | @as("dynamic_contract_registry") DynamicContractRegistry

  let name = "ENTITY_TYPE"
  let variants = [
    Account,
    AccountBalance,
    AccountPower,
    BalanceHistory,
    DaoMetricsDayBucket,
    Delegation,
    FeedEvent,
    ProposalOnchain,
    Token,
    TokenPrice,
    Transaction,
    Transfer,
    VoteOnchain,
    VotingPowerHistory,
    DynamicContractRegistry,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

module EventType = {
  @genType
  type t = 
    | @as("VOTE") VOTE
    | @as("PROPOSAL") PROPOSAL
    | @as("PROPOSAL_EXTENDED") PROPOSAL_EXTENDED
    | @as("DELEGATION") DELEGATION
    | @as("DELEGATION_VOTES_CHANGED") DELEGATION_VOTES_CHANGED
    | @as("TRANSFER") TRANSFER

  let name = "EventType"
  let variants = [
    VOTE,
    PROPOSAL,
    PROPOSAL_EXTENDED,
    DELEGATION,
    DELEGATION_VOTES_CHANGED,
    TRANSFER,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

module MetricType = {
  @genType
  type t = 
    | @as("total") Total
    | @as("delegated") Delegated
    | @as("cex") Cex
    | @as("dex") Dex
    | @as("lending") Lending
    | @as("circulating") Circulating
    | @as("treasury") Treasury
    | @as("non_circulating") Non_circulating

  let name = "MetricType"
  let variants = [
    Total,
    Delegated,
    Cex,
    Dex,
    Lending,
    Circulating,
    Treasury,
    Non_circulating,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

let allEnums = ([
  ContractType.config->Internal.fromGenericEnumConfig,
  EntityType.config->Internal.fromGenericEnumConfig,
  EventType.config->Internal.fromGenericEnumConfig,
  MetricType.config->Internal.fromGenericEnumConfig,
])
