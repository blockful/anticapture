import { Address, zeroAddress, Abi } from "viem";

import { DaoIdEnum, NetworkEnum } from "./enums";

export const DAYS_IN_YEAR = 365;
export const SECONDS_PER_BLOCK = 12; // Ethereum average

export const CONTRACT_ADDRESSES: Record<
  NetworkEnum,
  Partial<
    Record<
      DaoIdEnum,
      {
        token: { address: Address; decimals: number; startBlock: number };
        governor?: { address: Address; startBlock: number };
        blockTime: number; // Block time in seconds
      }
    >
  >
> = {
  [NetworkEnum.ETHEREUM]: {
    [DaoIdEnum.UNI]: {
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
      blockTime: 12, // Ethereum average block time
    },
    [DaoIdEnum.ENS]: {
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
      blockTime: 12, // Ethereum average block time
    },
  },
  [NetworkEnum.ARBITRUM]: {
    [DaoIdEnum.ARB]: {
      // https://arbiscan.io/address/0x912CE59144191C1204E64559FE8253a0e49E6548
      token: {
        address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
        decimals: 18,
        startBlock: 70398200,
      },
      blockTime: 0.25, // Arbitrum average block time
    },
  },
  [NetworkEnum.ANVIL]: {
    [DaoIdEnum.ENS]: {
      token: {
        address: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
        decimals: 18,
        startBlock: 22635098,
      },
      governor: {
        address: "0x7c28FC9709650D49c8d0aED2f6ece6b191F192a9",
        startBlock: 22635098,
      },
      blockTime: 1, // Anvil default block time
    },
  },
} as const;

export const TREASURY_ADDRESSES: Record<DaoIdEnum, Record<string, Address>> = {
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
};

export const CEXAddresses: Record<DaoIdEnum, Record<string, Address>> = {
  [DaoIdEnum.UNI]: {
    BinanceHotWallet: "0x5a52E96BAcdaBb82fd05763E25335261B270Efcb",
    BinanceHotWallet2: "0x28C6c06298d514Db089934071355E5743bf21d60",
    BinanceHotWallet3: "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3",
    BinanceHotWallet4: "0x43684D03D81d3a4C70da68feBDd61029d426F042",
    BinanceHotWallet5: "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549",
    BinanceHotWallet6: "0xDFd5293D8e347dFe59E90eFd55b2956a1343963d",
    BinanceUSHotWallet: "0x21d45650db732cE5dF77685d6021d7D5d1da807f",
    BinanceColdWallet: "0xF977814e90dA44bFA03b6295A0616a897441aceC",
    BinancePegTokenFunds: "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503",
    Robinhood: "0x73AF3bcf944a6559933396c1577B257e2054D935",
    AnchorageDigital1: "0x985DE23260743c2c2f09BFdeC50b048C7a18c461",
    AnchorageDigital2: "0xfad67fBdb7d4D8569671b8aa4A09F6a90d692Ed7",
    BybitColdWallet1: "0x88a1493366D48225fc3cEFbdae9eBb23E323Ade3",
    UpbitDeposit: "0xacCFeA7d9e618f60CE1347C52AE206262412AA4a",
    UpbitColdWallet: "0x245445940B317E509002eb682E03f4429184059d",
    KrakenColdWallet: "0xDA9dfA130Df4dE4673b89022EE50ff26f6EA73Cf",
    KrakenHotWallet: "0x4C6007e38Ce164Ed80FF8Ff94192225FcdAC68CD",
    KrakenHotWallet2: "0x0A332d03367366dd5fD3a554EF8f8B47ED36e591",
    Robinhood2: "0x2eFB50e952580f4ff32D8d2122853432bbF2E204",
    GeminiColdWallet: "0xAFCD96e580138CFa2332C632E66308eACD45C5dA",
    KrakenColdWallet2: "0xC06f25517E906b7F9B4deC3C7889503Bb00b3370",
    CoinbaseColdWallet: "0x6cc8FfF60A60AB0373fB3072f0B846450a8FA443",
    NobitexIrHotWallet: "0xF639d88a89384A4D97f2bA9159567Ddb3890Ea07",
    MEXCHotWallet: "0x4982085C9e2F89F2eCb8131Eca71aFAD896e89CB",
    MEXCHotWallet2: "0x2e8F79aD740de90dC5F5A9F0D8D9661a60725e64",
    OKXHotWallet: "0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b",
    StakeComHotWallet: "0xFa500178de024BF43CFA69B7e636A28AB68F2741",
    BinanceWithdrawalHotWallet: "0xe2fc31F816A9b94326492132018C3aEcC4a93aE1",
    NobitexIrHotWallet2: "0xd582C78a04E7379DfC9EE991A25f549576962eE1",
  },
  [DaoIdEnum.ENS]: {
    BinanceHotWallet: "0x5a52E96BAcdaBb82fd05763E25335261B270Efcb",
    BinanceHotWallet2: "0x28C6c06298d514Db089934071355E5743bf21d60",
    BinanceHotWallet3: "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3",
    BinanceHotWallet4: "0x43684D03D81d3a4C70da68feBDd61029d426F042",
    BinanceHotWallet5: "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549",
    BinanceHotWallet6: "0xDFd5293D8e347dFe59E90eFd55b2956a1343963d",
    BinanceUSHotWallet: "0x21d45650db732cE5dF77685d6021d7D5d1da807f",
    BitThumbHotWallet: "0x498697892fd0e5e3a16bd40D7bF2644F33CBbBd4",
    BybitColdWallet1: "0x88a1493366D48225fc3cEFbdae9eBb23E323Ade3",
    ByBitHotWallet: "0xf89d7b9c864f589bbF53a82105107622B35EaA40",
    BtcTurkColdWallet: "0x76eC5A0D3632b2133d9f1980903305B62678Fbd3",
    BitGetHotWallet: "0x5bdf85216ec1e38D6458C870992A69e38e03F7Ef",
    CryptoComHotWallet: "0xA023f08c70A23aBc7EdFc5B6b5E171d78dFc947e",
    CryptoComHotWallet2: "0xCFFAd3200574698b78f32232aa9D63eABD290703",
    BitThumbHotWallet2: "0x10522336d85Cb52628C84e06CB05f79011FEf585",
    ParibuColdWallet: "0xa23cbCdFAfd09De2ce793D0A08f51865885Be3f5",
    CoinOneHotWallet: "0x167A9333BF582556f35Bd4d16A7E80E191aa6476",
    BitvavoColdWallet: "0xc419733Ba8F13d8605141Cac8f681F5A0aBC0122",
    KuCoinHotWallet: "0xD6216fC19DB775Df9774a6E33526131dA7D19a2c",
    BitvavoColdWallet2: "0xedC6BacdC1e29D7c5FA6f6ECA6FDD447B9C487c9",
    CoinbaseHotWallet: "0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43",
    MEXCHotWallet3: "0x3CC936b795A188F0e246cBB2D74C5Bd190aeCF18",
    KuCoinColdWallet: "0x2933782B5A8d72f2754103D1489614F29bfA4625",
    UpbitColdWallet: "0x245445940B317E509002eb682E03f4429184059d",
  },
  [DaoIdEnum.ARB]: {},
};

export const DEXAddresses: Record<DaoIdEnum, Record<string, Address>> = {
  [DaoIdEnum.UNI]: {
    // ArbitrumL1ERC20Gateway: "0xa3a7b6f88361f48403514059f1f16c8e78d60eec",
    Uniswap_UNI_ETH_V3_03: "0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801",
    Uniswap_UNI_ETH_V3_1: "0x360b9726186C0F62cc719450685ce70280774Dc8",
    Uniswap_UNI_ETH_V2_03: "0xd3d2E2692501A5c9Ca623199D38826e513033a17",
    Uniswap_UNI_USDT_V3_03: "0x3470447f3CecfFAc709D3e783A307790b0208d60",
    Uniswap_UNI_AAVE_V3_03: "0x59c38b6775Ded821f010DbD30eCabdCF84E04756",
    Uniswap_UNI_USDC_V3_03: "0xD0fC8bA7E267f2bc56044A7715A489d851dC6D78",
    Uniswap_UNI_WBTC_V3_03: "0x8F0CB37cdFF37E004E0088f563E5fe39E05CCC5B",
    Uniswap_UNI_LINK_V3_1: "0xA6B9a13B34db2A00284299c47DACF49FB62C1755",
    Uniswap_UNI_1INCH_V3_1: "0x0619062B988576FE2d39b33fF23Fb1a0330c0ac7",
    Uniswap_UNI_ETH_V3_005: "0xfaA318479b7755b2dBfDD34dC306cb28B420Ad12",
    Sushi_UNI_ETH_V2_03: "0xDafd66636E2561b0284EDdE37e42d192F2844D40",
    BalancerCow_UNI_ETH: "0xa81b22966f1841e383e69393175e2cc65f0a8854",
  },
  [DaoIdEnum.ENS]: {
    Uniswap_ENS_5: "0x92560C178cE069CC014138eD3C2F5221Ba71f58a",
    SushiSwapEthENSV2: "0xa1181481beb2dc5de0daf2c85392d81c704bf75d",
  },
  [DaoIdEnum.ARB]: {},
};

export const LendingAddresses: Record<DaoIdEnum, Record<string, Address>> = {
  [DaoIdEnum.UNI]: {
    AaveEthUni: "0xF6D2224916DDFbbab6e6bd0D1B7034f4Ae0CaB18",
    MorphoBlue: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
    CompoundCUNI: "0x35A18000230DA775CAc24873d00Ff85BccdeD550",
  },
  [DaoIdEnum.ENS]: {
    //After research using intel.arkm and defi llama token-usage page, I only found this lending address so far
    AaveEthENS: "0x545bD6c032eFdde65A377A6719DEF2796C8E0f2e",
  },
  [DaoIdEnum.ARB]: {},
};

export const BurningAddresses: Record<
  DaoIdEnum,
  {
    ZeroAddress: Address;
    Dead: Address;
    TokenContract: Address;
    Airdrop?: Address;
  }
> = {
  [DaoIdEnum.UNI]: {
    ZeroAddress: zeroAddress,
    Dead: "0x000000000000000000000000000000000000dEaD",
    TokenContract: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    Airdrop: "0x090D4613473dEE047c3f2706764f49E0821D256e",
  },
  [DaoIdEnum.ENS]: {
    ZeroAddress: zeroAddress,
    Dead: "0x000000000000000000000000000000000000dEaD",
    TokenContract: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
  },
  [DaoIdEnum.ARB]: {
    ZeroAddress: zeroAddress,
    Dead: "0x000000000000000000000000000000000000dEaD",
    TokenContract: "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1",
  },
};

export enum MetricTypesEnum {
  TOTAL_SUPPLY = "TOTAL_SUPPLY",
  DELEGATED_SUPPLY = "DELEGATED_SUPPLY",
  CEX_SUPPLY = "CEX_SUPPLY",
  DEX_SUPPLY = "DEX_SUPPLY",
  LENDING_SUPPLY = "LENDING_SUPPLY",
  CIRCULATING_SUPPLY = "CIRCULATING_SUPPLY",
  TREASURY = "TREASURY",
}

export const metricTypeArray = Object.values(MetricTypesEnum);
