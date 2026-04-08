
type hyperSyncConfig = {endpointUrl: string}
type hyperFuelConfig = {endpointUrl: string}

@genType.opaque
type rpcConfig = {
  syncConfig: Config.sourceSync,
}

@genType
type syncSource = HyperSync(hyperSyncConfig) | HyperFuel(hyperFuelConfig) | Rpc(rpcConfig)

@genType.opaque
type aliasAbi = Ethers.abi

type eventName = string

type contract = {
  name: string,
  abi: aliasAbi,
  addresses: array<string>,
  events: array<eventName>,
}

type configYaml = {
  syncSource,
  startBlock: int,
  confirmedBlockThreshold: int,
  contracts: dict<contract>,
  lowercaseAddresses: bool,
}

let publicConfig = ChainMap.fromArrayUnsafe([
  {
    let contracts = Js.Dict.fromArray([
      (
        "ENSToken",
        {
          name: "ENSToken",
          abi: Types.ENSToken.abi,
          addresses: [
            "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
          ],
          events: [
            Types.ENSToken.Transfer.name,
            Types.ENSToken.DelegateChanged.name,
            Types.ENSToken.DelegateVotesChanged.name,
          ],
        }
      ),
      (
        "ENSGovernor",
        {
          name: "ENSGovernor",
          abi: Types.ENSGovernor.abi,
          addresses: [
            "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
          ],
          events: [
            Types.ENSGovernor.ProposalCreated.name,
            Types.ENSGovernor.VoteCast.name,
            Types.ENSGovernor.ProposalCanceled.name,
            Types.ENSGovernor.ProposalExecuted.name,
            Types.ENSGovernor.ProposalQueued.name,
          ],
        }
      ),
    ])
    let chain = ChainMap.Chain.makeUnsafe(~chainId=1)
    (
      chain,
      {
        confirmedBlockThreshold: 200,
        syncSource: HyperSync({endpointUrl: "https://eth.hypersync.xyz"}),
        startBlock: 9380410,
        contracts,
        lowercaseAddresses: false
      }
    )
  },
])

@genType
let getGeneratedByChainId: int => configYaml = chainId => {
  let chain = ChainMap.Chain.makeUnsafe(~chainId)
  if !(publicConfig->ChainMap.has(chain)) {
    Js.Exn.raiseError(
      "No chain with id " ++ chain->ChainMap.Chain.toString ++ " found in config.yaml",
    )
  }
  publicConfig->ChainMap.get(chain)
}
