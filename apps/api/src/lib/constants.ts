import { Address } from "viem";

import { DaoIdEnum } from "./enums";

export const CONTRACT_ADDRESSES = {
  [DaoIdEnum.UNI]: {
    blockTime: 12,
    tokenType: "ERC20",
    // https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
    token: {
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      decimals: 18,
      startBlock: 10861674,
    },
    // https://etherscan.io/address/0x408ED6354d4973f66138C91495F2f2FCbd8724C3
    governor: {
      address: "0x408ED6354d4973f66138C91495F2f2FCbd8724C3",
      startBlock: 13059157,
    },
  },
  [DaoIdEnum.ENS]: {
    blockTime: 12,
    tokenType: "ERC20",
    // https://etherscan.io/address/0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72
    token: {
      address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
      decimals: 18,
      startBlock: 9380410,
    },
    // https://etherscan.io/address/0x323a76393544d5ecca80cd6ef2a560c6a395b7e3
    governor: {
      address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
      startBlock: 13533772,
    },
  },
  [DaoIdEnum.ARB]: {
    blockTime: 0.25,
    // https://arbiscan.io/address/0x912CE59144191C1204E64559FE8253a0e49E6548
    tokenType: "ERC20",
    token: {
      address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      decimals: 18,
      startBlock: 70398200,
    },
  },
  [DaoIdEnum.OP]: {
    blockTime: 2,
    tokenType: "ERC20",
    optimisticProposalType: 2,
    // https://optimistic.etherscan.io/token/0x4200000000000000000000000000000000000042
    token: {
      address: "0x4200000000000000000000000000000000000042",
      decimals: 18,
      startBlock: 6490467,
    },
    // https://optimistic.etherscan.io/address/0xcDF27F107725988f2261Ce2256bDfCdE8B382B10
    governor: {
      address: "0xcDF27F107725988f2261Ce2256bDfCdE8B382B10",
      startBlock: 71801427,
    },
  },
  [DaoIdEnum.GTC]: {
    blockTime: 12,
    // https://etherscan.io/address/0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F
    tokenType: "ERC20",
    token: {
      address: "0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F",
      decimals: 18,
      startBlock: 12422079,
    },
    // https://etherscan.io/address/0x9D4C63565D5618310271bF3F3c01b2954C1D1639
    governor: {
      address: "0x9D4C63565D5618310271bF3F3c01b2954C1D1639",
      startBlock: 17813942,
    },
    // https://etherscan.io/address/0xDbD27635A534A3d3169Ef0498beB56Fb9c937489
    governorAlpha: {
      address: "0xDbD27635A534A3d3169Ef0498beB56Fb9c937489",
      startBlock: 12497481,
    },
    // Live governor. Status reads stay on `governor` (Bravo): Charlie has no
    // proposals yet, and one quorum() target would recompute Bravo proposals.
    // https://etherscan.io/address/0xef41CbD211076E8b1901e214Bf751d404cf06638
    governorCharlie: {
      address: "0xef41CbD211076E8b1901e214Bf751d404cf06638",
      startBlock: 25776742,
    },
  },
  [DaoIdEnum.LIL_NOUNS]: {
    blockTime: 12,
    tokenType: "ERC721",
    token: {
      // https://etherscan.io/address/0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B
      address: "0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B",
      decimals: 0,
      startBlock: 14736710,
    },
    governor: {
      // https://etherscan.io/address/0x5d2C31ce16924C2a71D317e5BbFd5ce387854039
      address: "0x5d2C31ce16924C2a71D317e5BbFd5ce387854039",
      startBlock: 14736719,
    },
  },
  [DaoIdEnum.NOUNS]: {
    blockTime: 12,
    tokenType: "ERC721",
    token: {
      // https://etherscan.io/token/0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03
      address: "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03",
      decimals: 0,
      startBlock: 12985438,
    },
    governor: {
      // https://etherscan.io/address/0x6f3e6272a167e8accb32072d08e0957f9c79223d
      address: "0x6f3e6272a167e8accb32072d08e0957f9c79223d",
      startBlock: 12985453,
    },
    auction: {
      // https://etherscan.io/address/0x830BD73E4184ceF73443C15111a1DF14e495C706
      address: "0x830BD73E4184ceF73443C15111a1DF14e495C706",
      startBlock: 12985451,
    },
  },
  [DaoIdEnum.SCR]: {
    blockTime: 1.5,
    // https://scrollscan.com/address/0xd29687c813D741E2F938F4aC377128810E217b1b
    tokenType: "ERC20",
    token: {
      address: "0xd29687c813D741E2F938F4aC377128810E217b1b",
      decimals: 18,
      startBlock: 8949006,
    },
    // https://scrollscan.com/address/0x2f3f2054776bd3c2fc30d750734a8f539bb214f0
    governor: {
      address: "0x2f3f2054776bd3c2fc30d750734a8f539bb214f0",
      startBlock: 8963441,
    },
  },
  [DaoIdEnum.COMP]: {
    blockTime: 12,
    // https://etherscan.io/address/0xc00e94Cb662C3520282E6f5717214004A7f26888
    tokenType: "ERC20",
    token: {
      address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
      decimals: 18,
      startBlock: 9601359,
    },
    // https://etherscan.io/address/0x309a862bbC1A00e45506cB8A802D1ff10004c8C0
    governor: {
      address: "0x309a862bbC1A00e45506cB8A802D1ff10004c8C0",
      startBlock: 21688680,
    },
  },
  [DaoIdEnum.OBOL]: {
    blockTime: 12,
    tokenType: "ERC20",
    // https://etherscan.io/address/0x0B010000b7624eb9B3DfBC279673C76E9D29D5F7
    // Token created: Sep-19-2022 11:12:47 PM UTC
    token: {
      address: "0x0B010000b7624eb9B3DfBC279673C76E9D29D5F7",
      decimals: 18,
      startBlock: 15570746,
    },
    // https://etherscan.io/address/0xcB1622185A0c62A80494bEde05Ba95ef29Fbf85c
    // Governor created: Feb-19-2025 10:34:47 PM UTC
    governor: {
      address: "0xcB1622185A0c62A80494bEde05Ba95ef29Fbf85c",
      startBlock: 21883431,
    },
  },
  [DaoIdEnum.ZK]: {
    blockTime: 1,
    tokenType: "ERC20",
    // https://explorer.zksync.io/address/0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E
    token: {
      address: "0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E",
      decimals: 18,
      startBlock: 34572100,
    },
    // https://explorer.zksync.io/address/0xb83FF6501214ddF40C91C9565d095400f3F45746
    governor: {
      address: "0xb83FF6501214ddF40C91C9565d095400f3F45746",
      startBlock: 55519658,
    },
  },
  [DaoIdEnum.FLUID]: {
    blockTime: 12,
    tokenType: "ERC20",
    // https://etherscan.io/address/0x6f40d4A6237C257fff2dB00FA0510DeEECd303eb
    token: {
      address: "0x6f40d4A6237C257fff2dB00FA0510DeEECd303eb",
      decimals: 18,
      startBlock: 12183236,
    },
    // https://etherscan.io/address/0x0204Cd037B2ec03605CFdFe482D8e257C765fA1B
    governor: {
      address: "0x0204Cd037B2ec03605CFdFe482D8e257C765fA1B",
      startBlock: 12183245,
    },
  },
  [DaoIdEnum.SHU]: {
    blockTime: 12,
    tokenType: "ERC20",
    // https://etherscan.io/address/0xe485E2f1bab389C08721B291f6b59780feC83Fd7
    token: {
      address: "0xe485E2f1bab389C08721B291f6b59780feC83Fd7",
      decimals: 18,
      startBlock: 19021394,
    },
    // https://etherscan.io/address/0xAA6BfA174d2f803b517026E93DBBEc1eBa26258e
    azorius: {
      address: "0xAA6BfA174d2f803b517026E93DBBEc1eBa26258e",
      startBlock: 19021698,
    },
    // https://etherscan.io/address/0x4b29d8B250B8b442ECfCd3a4e3D91933d2db720F
    linearVotingStrategy: {
      address: "0x4b29d8B250B8b442ECfCd3a4e3D91933d2db720F",
      startBlock: 19021698,
    },
  },
  [DaoIdEnum.AAVE]: {
    blockTime: 12,
    tokenType: "ERC20",
    token: {
      address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
      decimals: 18,
      startBlock: 12422079,
    },
  },
  [DaoIdEnum.TORN]: {
    blockTime: 12,
    tokenType: "ERC20",
    token: {
      address: "0x77777FeDdddFfC19Ff86DB637967013e6C6A116C",
      decimals: 18,
      startBlock: 11474599,
    },
    governor: {
      address: "0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce",
      startBlock: 11474695,
    },
  },
} as const;

export const TreasuryAddresses: Record<DaoIdEnum, Record<string, Address>> = {
  [DaoIdEnum.UNI]: {
    timelock: "0x1a9C8182C09F50C8318d769245beA52c32BE35BC",
    treasuryVester1: "0x4750c43867EF5F89869132ecCF19B9b6C4286E1a",
    treasuryVester2: "0xe3953D9d317B834592aB58AB2c7A6aD22b54075D",
    treasuryVester3: "0x4b4e140D1f131fdaD6fb59C13AF796fD194e4135",
    treasuryVester4: "0x3D30B1aB88D487B0F3061F40De76845Bec3F1e94",
  },
  [DaoIdEnum.ENS]: {
    timelock: "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7",
    endaoment: "0x4F2083f5fBede34C2714aFfb3105539775f7FE64",
    oldEthRegistrarController: "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5",
    ethRegistrarController: "0x253553366Da8546fC250F225fe3d25d0C782303b",
  },
  [DaoIdEnum.ARB]: {
    // https://docs.arbitrum.foundation/deployment-addresses
    "DAO Treasury": "0xF3FC178157fb3c87548bAA86F9d24BA38E649B58",
    "L2 Treasury Timelock": "0xbFc1FECa8B09A5c5D3EFfE7429eBE24b9c09EF58",
    "L2 Core Timelock": "0x34d45e99f7D8c45ed05B5cA72D54bbD1fb3F98f0",
    "Foundation Vesting Wallet": "0x15533b77981cDa0F85c4F9a485237DF4285D6844",
  },
  [DaoIdEnum.AAVE]: {
    // https://github.com/bgd-labs/aave-address-book
    Collector: "0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c",
    "Ecosystem Reserve": "0x25F2226B597E8F9514B3F68F00f494cF4f286491",
  },
  [DaoIdEnum.OP]: {
    // https://gov.optimism.io/t/where-are-the-optimisms-main-treasury-addresses/8880
    "Unallocated Treasury": "0x2A82Ae142b2e62Cb7D10b55E323ACB1Cab663a26",
    "Foundation Budget": "0x2501c477D0A35545a387Aa4A3EEe4292A9a8B3F0",
    "Foundation Grants": "0x19793c7824Be70ec58BB673CA42D2779d12581BE",
    "Foundation Locked Grants": "0xE4553b743E74dA3424Ac51f8C1E586fd43aE226F",
  },
  [DaoIdEnum.SHU]: { timelock: "0x36bD3044ab68f600f6d3e081056F34f2a58432c4" },
  [DaoIdEnum.LIL_NOUNS]: {
    timelock: "0xd5f279ff9EB21c6D40C8f345a66f2751C4eeA1fB",
  },
  [DaoIdEnum.NOUNS]: {
    timelock: "0xb1a32fc9f9d8b2cf86c068cae13108809547ef71",
    auction: "0x830BD73E4184ceF73443C15111a1DF14e495C706",
  },
  [DaoIdEnum.GTC]: {
    "Gitcoin Timelock": "0x57a8865cfB1eCEf7253c27da6B4BC3dAEE5Be518",
    "Gitcoin CSDO": "0x931896A8A9313F622a2AFCA76d1471B97955e551",
    "Gitcoin Fraud Detection & Defense":
      "0xD4567069C5a1c1fc8261d8Ff5C0B1d98f069Cf47",
    "Gitcoin Grants Matching Pool":
      "0xde21F729137C5Af1b01d73aF1dC21eFfa2B8a0d6",
    "Gitcoin Merch, Memes and Marketing":
      "0xC23DA3Ca9300571B9CF43298228353cbb3E1b4c0",
    "Gitcoin Timelock Transfer 1": "0x6EEdE31a2A15340342B4BCb3039447d457aC7C4b",
    "Gitcoin Timelock Transfer 2": "0xeD95D629c4Db80060C59432e81254D256AEc97E2",
    "Vesting Address GTC 1": "0x2AA5d15Eb36E5960d056e8FeA6E7BB3e2a06A351",
    "Staking contract GTC": "0x0E3efD5BE54CC0f4C64e0D186b0af4b7F2A0e95F",
    "Vesting Address GTC 3": "0x2CDE9919e81b20B4B33DD562a48a84b54C48F00C",
    "Gitcoin Timelock Transfer 5": "0x9E75c3BFb82cf701AC0A74d6C1607461Ec65EfF9",
  },
  [DaoIdEnum.SCR]: {
    "DAO Treasury": "0x4cb06982dD097633426cf32038D9f1182a9aDA0c",
    "Foundation Treasury": "0xfF120e015777E9AA9F1417a4009a65d2EdA78C13",
    "Ecosystem Treasury": "0xeE198F4a91E5b05022dc90535729B2545D3b03DF",
  },
  [DaoIdEnum.COMP]: {
    Timelock: "0x6d903f6003cca6255D85CcA4D3B5E5146dC33925",
    Comptroller: "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B",
    /// v2 markets
    v2WBTC: "0xccF4429DB6322D5C611ee964527D42E5d685DD6a",
    v2USDC: "0x39AA39c021dfbaE8faC545936693aC917d5E7563",
    v2DAI: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
    v2USDT: "0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9",
    v2ETH: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
    v2UNI: "0x35A18000230DA775CAc24873d00Ff85BccdeD550",
    v2BAT: "0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E",
    v2LINK: "0xFAce851a4921ce59e912d19329929CE6da6EB0c7",
    v2TUSD: "0x12392F67bdf24faE0AF363c24aC620a2f67DAd86",
    v2AAVE: "0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c",
    v2COMP: "0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4",
    ///v3 markets
    //Ethereum markets
    mainnetETH: "0xA17581A9E3356d9A858b789D68B4d866e593aE94",
    mainnetstETH: "0x3D0bb1ccaB520A66e607822fC55BC921738fAFE3",
    mainnetUSDS: "0x5D409e56D886231aDAf00c8775665AD0f9897b56",
    mainnetWBTC: "0xe85Dc543813B8c2CFEaAc371517b925a166a9293",
  },
  [DaoIdEnum.OBOL]: {
    timelock: "0xCdBf527842Ab04Da548d33EB09d03DB831381Fb0",
    "Ecosystem Treasury 1": "0x42D201CC4d9C1e31c032397F54caCE2f48C1FA72",
    "Ecosystem Treasury 2": "0x54076088bE86943e27B99120c5905AAD8A1bD166",
    "Staking Rewards Reserve": "0x33f3D61415784A5899b733976b0c1F9176051569",
    "OBOL Incentives Reserve": "0xdc8A309111aB0574CA51cA9C7Dd0152738e4c374",
    "Protocol Revenue": "0xDe5aE4De36c966747Ea7DF13BD9589642e2B1D0d",
    "Grant Program": "0xa59f60A7684A69E63c07bEC087cEC3D0607cd5cE",
    "DV Labs Treasury 2": "0x6BeFB6484AA10187947Dda81fC01e495f7168dB4",
  },
  [DaoIdEnum.ZK]: {
    timelock: "0xe5d21A9179CA2E1F0F327d598D464CcF60d89c3d",
  },
  [DaoIdEnum.FLUID]: {
    "InstaDApp Treasury": "0x28849D2b63fA8D361e5fc15cB8aBB13019884d09",
    "Fluid Liquidity": "0x52Aa899454998Be5b000Ad077a46Bbe360F4e497",
    "Chainlink CCIP LockReleaseTokenPool":
      "0x639f35C5E212D61Fe14Bd5CD8b66aAe4df11a50c",
    // governor.timelock(). The previous entry, 0xC7Cb1dE2721BFC0E0DA1b9D526bCdC54eF1C0eFC,
    // is not the contract the governor executes through.
    InstaTimelock: "0x2386DC45AdDed673317eF068992F19421B481F4c",
  },
  [DaoIdEnum.TORN]: {
    governor: "0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce",
  },
};

// Mirrors the indexer's NonCirculatingAddresses. Locked/vesting supply held by
// DAO-controlled contracts; excluded from holder listings alongside treasury
// when excludeDaoAddresses is set.
export const NonCirculatingAddresses: Record<
  DaoIdEnum,
  Record<string, Address>
> = {
  [DaoIdEnum.UNI]: {},
  [DaoIdEnum.ENS]: {
    "Token Timelock": "0xd7a029db2585553978190db5e85ec724aa4df23f",
  },
  [DaoIdEnum.ARB]: {},
  [DaoIdEnum.AAVE]: {
    "LEND to AAVE Migrator": "0x317625234562B1526Ea2FaC4030Ea499C5291de4",
  },
  [DaoIdEnum.OP]: {},
  [DaoIdEnum.SHU]: {},
  [DaoIdEnum.LIL_NOUNS]: {},
  [DaoIdEnum.NOUNS]: {},
  [DaoIdEnum.GTC]: {},
  [DaoIdEnum.SCR]: {},
  [DaoIdEnum.COMP]: {},
  [DaoIdEnum.OBOL]: {},
  [DaoIdEnum.ZK]: {
    "Initial Merkle Distributor": "0x66fd4fc8fa52c9bec2aba368047a0b27e24ecfe4",
    "Second ZK Distributor": "0xb294F411cB52c7C6B6c0B0b61DBDf398a8b0725d",
    "Third ZK Distributor": "0xf29d698e74ef1904bcfdb20ed38f9f3ef0a89e5b",
    "Matter Labs Allocation": "0xa97fbc75ccbc7d4353c4d2676ed18cd0c5aaf7e6",
    "Foundation Allocation": "0xd78dc27d4db8f428c67f542216a2b23663838405",
    "Guardians Allocation": "0x21b27952f8621f54f3cb652630e122ec81dd2dc1",
    "Security Council Allocation": "0x0ad50686c159040e57ddce137db0b63c67473450",
    "ZKsync Association Allocation":
      "0x0681e3808a0aa12004fb815ebb4515dc823cfbb4",
  },
  [DaoIdEnum.FLUID]: {},
  [DaoIdEnum.TORN]: {
    governance: "0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce",
    vault: "0x2F50508a8a3D323B91336FA3eA6ae50E55f32185",
  },
};

export enum ProposalStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  CANCELED = "CANCELED",
  DEFEATED = "DEFEATED",
  SUCCEEDED = "SUCCEEDED",
  QUEUED = "QUEUED",
  EXPIRED = "EXPIRED",
  PENDING_EXECUTION = "PENDING_EXECUTION",
  EXECUTED = "EXECUTED",
  VETOED = "VETOED",
  NO_QUORUM = "NO_QUORUM",
}

export enum MetricTypesEnum {
  TOTAL_SUPPLY = "TOTAL_SUPPLY",
  DELEGATED_SUPPLY = "DELEGATED_SUPPLY",
  CEX_SUPPLY = "CEX_SUPPLY",
  DEX_SUPPLY = "DEX_SUPPLY",
  LENDING_SUPPLY = "LENDING_SUPPLY",
  CIRCULATING_SUPPLY = "CIRCULATING_SUPPLY",
  TREASURY = "TREASURY",
}

export const MetricTypesArray = Object.values(MetricTypesEnum) as [
  string,
  ...string[],
];

export enum FeedRelevance {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

// Query-only counterpart of FeedRelevance: the tiers are cumulative value
// floors (LOW also returns MEDIUM and HIGH) and ALL drops the floor entirely.
// ALL is not a tier an event can have, so it lives apart from FeedRelevance.
export enum FeedRelevanceFilter {
  ALL = "ALL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export enum FeedEventType {
  VOTE = "VOTE",
  PROPOSAL = "PROPOSAL",
  DELEGATION = "DELEGATION",
  TRANSFER = "TRANSFER",
  PROPOSAL_EXTENDED = "PROPOSAL_EXTENDED",
}
