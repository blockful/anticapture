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
  [DaoIdEnum.ARB]: {},
  [DaoIdEnum.OP]: {},
  [DaoIdEnum.NOUNS]: {
    timelock: "0xb1a32fc9f9d8b2cf86c068cae13108809547ef71",
    auction: "0x830BD73E4184ceF73443C15111a1DF14e495C706",
  },
  [DaoIdEnum.GTC]: {
    "Gitcoin Timelock": "0x57a8865cfB1eCEf7253c27da6B4BC3dAEE5Be518",
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
    mainnetUSDT: "0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840",
    mainnetUSDS: "0x5D409e56D886231aDAf00c8775665AD0f9897b56",
    mainnetUSDC: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
    mainnetWBTC: "0xe85Dc543813B8c2CFEaAc371517b925a166a9293",
    // Optimism markets
    opETH: "0xE36A30D249f7761327fd973001A32010b521b6Fd",
    opUSDT: "0x995E394b8B2437aC8Ce61Ee0bC610D617962B214",
    opUSDC: "0x2e44e174f7D53F0212823acC11C01A11d58c5bCB",
    // Unichain markets
    uniUSDC: "0x2c7118c4C88B9841FCF839074c26Ae8f035f2921",
    uniETH: "0x6C987dDE50dB1dcDd32Cd4175778C2a291978E2a",
    // Polygon markets
    polyUSDT0: "0xaeB318360f27748Acb200CE616E389A6C9409a07",
    polyUSDC: "0xF25212E676D1F7F89Cd72fFEe66158f541246445",
    // Ronin markets
    ronWETH: "0x4006ed4097ee51c09a04c3b0951d28ccf19e6dfe",
    ronRON: "0xc0Afdbd1cEB621Ef576BA969ce9D4ceF78Dbc0c0",
    // Mantle markets
    manUSDe: "0x606174f62cd968d8e684c645080fa694c1D7786E",
    // Base markets
    manUSDbC: "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf",
    manUSDC: "0xb125E6687d4313864e53df431d5425969c15Eb2F",
    manAERO: "0x784efeB622244d2348d4F2522f8860B96fbEcE89",
    manUSDS: "0x2c776041CCFe903071AF44aa147368a9c8EEA518",
    manETH: "0x46e6b214b524310239732D51387075E0e70970bf",
    // Arbitrum marketsVOTE
    arbUSDT0: "0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07",
    arbUSDC: "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf",
    "arbUSDC.e": "0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA",
    arbETH: "0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486",
    // Linea markets
    linUSDC: "0x8D38A3d6B3c3B7d96D6536DA7Eef94A9d7dbC991",
    linETH: "0x60F2058379716A64a7A5d29219397e79bC552194",
    // Scroll markets
    scrUSDC: "0xB2f97c1Bd3bf02f5e74d13f02E3e26F93D77CE44",
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

export enum FeedEventType {
  VOTE = "VOTE",
  PROPOSAL = "PROPOSAL",
  DELEGATION = "DELEGATION",
  TRANSFER = "TRANSFER",
  // DELEGATION_VOTES_CHANGED = "DELEGATION_VOTES_CHANGED", // removed because feed event list don't use it
  PROPOSAL_EXTENDED = "PROPOSAL_EXTENDED",
}
