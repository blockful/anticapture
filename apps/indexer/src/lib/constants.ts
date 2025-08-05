import { Address, zeroAddress } from "viem";

import { DaoIdEnum } from "./enums";

export const DAYS_IN_YEAR = 365;

export const CONTRACT_ADDRESSES = {
  [DaoIdEnum.UNI]: {
    blockTime: 12,
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
    token: {
      address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      decimals: 18,
      startBlock: 70398200,
    },
  },
  [DaoIdEnum.OP]: {
    blockTime: 2,
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
  [DaoIdEnum.TEST]: {
    blockTime: 12,
    token: {
      address: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
      decimals: 18,
      startBlock: 22635098,
    },
    governor: {
      address: "0x7c28FC9709650D49c8d0aED2f6ece6b191F192a9",
      startBlock: 22635098,
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
  [DaoIdEnum.OP]: {},
  [DaoIdEnum.TEST]: {},
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
  [DaoIdEnum.OP]: {
    "Binance 1": "0xF977814e90dA44bFA03b6295A0616a897441aceC",
    "Binance 2": "0x5a52E96BAcdaBb82fd05763E25335261B270Efcb",
    OKX: "0x611f7bF868a6212f871e89F7e44684045DdFB09d",
    Bybit: "0xf89d7b9c864f589bbF53a82105107622B35EaA40",
    "Bybit 2": "0x88a1493366D48225fc3cEFbdae9eBb23E323Ade3",
    Bithumb: "0xB18fe4B95b7d633c83689B5Ed3ac4ad0a857A2a7",
    MEXC: "0xDF90C9B995a3b10A5b8570a47101e6c6a29eb945",
    Gate: "0xC882b111A75C0c657fC507C04FbFcD2cC984F071",
    "Kraken 1": "0x2a62C4aCcA1A166Ee582877112682cAe8Cc0ffe7",
    "Kraken 2": "0xC06f25517E906b7F9B4deC3C7889503Bb00b3370",
    "Bitkub 1": "0xda4231EF1768176536EEE3ec187315E60572BBD4",
    "Bitkub 2": "0x7A1CF8CE543F4838c964FB14D403Cc6ED0bDbaCC",
    Bitget: "0x5bdf85216ec1e38D6458C870992A69e38e03F7Ef",
    "Kucoin 1": "0x2933782B5A8d72f2754103D1489614F29bfA4625",
    "Kucoin 2": "0xC1274c580C5653cDF8246695c2E0112492a99D6F",
    "Kucoin 3": "0xa3f45e619cE3AAe2Fa5f8244439a66B203b78bCc",
    "Coinbase 1": "0xC8373EDFaD6d5C5f600b6b2507F78431C5271fF5",
    "Coinbase 2": "0xD839C179a4606F46abD7A757f7Bb77D7593aE249",
    "Crypto.com 1": "0x8a161a996617f130d0F37478483AfC8c1914DB6d",
    "Crypto.com 2": "0x92BD687953Da50855AeE2Df0Cff282cC2d5F226b",
    "Btcturk 1": "0xdE2fACa4BBC0aca08fF04D387c39B6f6325bf82A",
    "Btcturk 2": "0xB5A46bC8b76FD2825AEB43db9C9e89e89158ECdE",
    "Bitpanda 1": "0xb1A63489469868dD1d0004922C36D5079d6331c6",
    "Bitpanda 2": "0x5E8c4499fDD78A5EFe998b3ABF78658E02BB7702",
    "Bitpanda 3": "0x0529ea5885702715e83923c59746ae8734c553B7",
    "BingX 1": "0xC3dcd744db3f114f0edF03682b807b78A227Bf74",
    "Bingx 2": "0x0b07f64ABc342B68AEc57c0936E4B6fD4452967E",
    "HTX 1": "0xe0B7A39Fef902c21bAd124b144c62E7F85f5f5fA",
    "HTX 2": "0xd3Cc0C7d40366A061397274Eae7C387D840e6ff8",
    Bitbank: "0x3727cfCBD85390Bb11B3fF421878123AdB866be8",
    Revolut: "0x9b0c45d46D386cEdD98873168C36efd0DcBa8d46",
    "Paribu 1": "0xc80Afd311c9626528De66D86814770361Fe92416",
    Coinspot: "0xf35A6bD6E0459A4B53A27862c51A2A7292b383d1",
    "Bitvavo 1": "0x48EcA43dB3a3Ca192a5fB9b20F4fc4d96017AF0F",
    SwissBorg: "0x28cC933fecf280E720299b1258e8680355D8841F",
    "Coinbase Prime": "0xDfD76BbFEB9Eb8322F3696d3567e03f894C40d6c",
    "Binance US": "0x43c5b1C2bE8EF194a509cF93Eb1Ab3Dbd07B97eD",
    "Bitstamp 1": "0x7C43E0270c868D0341c636a38C07e5Ae93908a04",
    "Bitstamp 2": "0x4c2eEb203DDC70291e33796527dE4272Ac9fafc1",
    "Coinhako 1": "0xE66BAa0B612003AF308D78f066Bbdb9a5e00fF6c",
    "Coinhako 2": "0xE66BAa0B612003AF308D78f066Bbdb9a5e00fF6c",
    Bitfinex: "0x77134cbC06cB00b66F4c7e623D5fdBF6777635EC",
    "Woo Network": "0x63DFE4e34A3bFC00eB0220786238a7C6cEF8Ffc4",
    Koribit: "0xf0bc8FdDB1F358cEf470D63F96aE65B1D7914953",
    "Indodax 1": "0x3C02290922a3618A4646E3BbCa65853eA45FE7C6",
    "Indodax 2": "0x91Dca37856240E5e1906222ec79278b16420Dc92",
  },
  [DaoIdEnum.TEST]: {},
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
  [DaoIdEnum.OP]: {
    "Velodrome Finance": "0x47029bc8f5CBe3b464004E87eF9c9419a48018cd",
    "Uniswap 1": "0x9a13F98Cb987694C9F086b1F5eB990EeA8264Ec3",
    "Uniswap 2": "0xFC1f3296458F9b2a27a0B91dd7681C4020E09D05",
    "Uniswap 3": "0xA39fe8F7A00CE28B572617d3a0bC1c2B44110e79",
    "WooFi 1": "0x5520385bFcf07Ec87C4c53A7d8d65595Dff69FA4",
    Curve: "0xd8dD9a8b2AcA88E68c46aF9008259d0EC04b7751",
    Balancer: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    Mux: "0xc6BD76FA1E9e789345e003B361e4A0037DFb7260",
  },
  [DaoIdEnum.TEST]: {},
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
  [DaoIdEnum.OP]: {
    Aave: "0x513c7E3a9c69cA3e22550eF58AC1C0088e918FFf",
    Superfluid: "0x1828Bff08BD244F7990edDCd9B19cc654b33cDB4",
    Moonwell: "0x9fc345a20541Bf8773988515c5950eD69aF01847",
    "Silo Finance": "0x8ED1609D796345661d36291B411992e85DE7B224",
    "Compound 1": "0x2e44e174f7D53F0212823acC11C01A11d58c5bCB",
    "Compound 2": "0x995E394b8B2437aC8Ce61Ee0bC610D617962B214",
    "Exactly Protocol": "0xa430A427bd00210506589906a71B54d6C256CEdb",
    Morpho: "0xF057afeEc22E220f47AD4220871364e9E828b2e9",
    dForce: "0x7702dC73e8f8D9aE95CF50933aDbEE68e9F1D725",
  },
  [DaoIdEnum.TEST]: {},
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
  [DaoIdEnum.OP]: {
    ZeroAddress: zeroAddress,
    Dead: "0x000000000000000000000000000000000000dEaD",
    TokenContract: "0x4200000000000000000000000000000000000042",
  },
  [DaoIdEnum.TEST]: {
    ZeroAddress: zeroAddress,
    Dead: "0x000000000000000000000000000000000000dEaD",
    TokenContract: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
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
  EXECUTED = "EXECUTED",
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

export const metricTypeArray = Object.values(MetricTypesEnum);
