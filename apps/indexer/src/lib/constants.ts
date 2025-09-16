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
  [DaoIdEnum.GTC]: {
    blockTime: 12,
    // https://etherscan.io/address/0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F
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
    token: {
      address: "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03",
      decimals: 18,
      startBlock: 12985438,
    },
    governor: {
      address: "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d",
      startBlock: 12985453,
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
  [DaoIdEnum.NOUNS]: {},
  [DaoIdEnum.TEST]: {},
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
    "OKX Ventures": "0xe527BbDE3654E9ba824f9B72DFF495eEe60fD366",
    "Protocol Labs 1": "0x154855f5522f6B04ce654175368F428852DCd55D",
    "Matt Solomon": "0x7aD3d9819B06E800F8A65f3440D599A23D6A0BDf",
    "Arbitrum Bridge": "0xa3A7B6F88361F48403514059F1F16C8E78d60EeC",
    "Optimism Bridge": "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1",
    "Radicle Timelock": "0x8dA8f82d2BbDd896822de723F55D6EdF416130ba",
    "Vesting Address GTC 3": "0x2CDE9919e81b20B4B33DD562a48a84b54C48F00C",
    "deltajuliet.eth 1": "0x5b1ddBEC956Ed39e1aC92AE3c3D99295ddD59865",
    "deltajuliet.eth 2": "0x407466C56B8488c4d99558633Ff1AC5D84400B46",
    "deltajuliet.eth 3": "0x14b9F70C3d4B367D496F3771EdA7EFA65282e55D",
    "deltajuliet.eth 4": "0x0dcFc9323539A6eC47f9BC0A96882070540bf950",
    "deltajuliet.eth 5": "0x08f3FB287AEc4E06EFF8de37410eaF52B05c7f56",
    "Gitcoin Timelock Transfer 5": "0x9E75c3BFb82cf701AC0A74d6C1607461Ec65EfF9",
    "Old Address, Large GTC Transfers 1":
      "0xF5A7bA226CB94D87C29aDD2b59aC960904a163F3",
    "Old Address, Large GTC Transfers 2":
      "0xeD865C87c3509e3A908655777B13f7313b2fc196",
    "Old Address, Large GTC Transfers 3":
      "0xDD6a165B9e05549640149dF108AC0aF8579B7005",
    "Old Address, Large GTC Transfers 4":
      "0xaD467E6039F0Ca383b5FFd60F1C7a890acaB4bE3",
    "Old Address, Large GTC Transfers 5":
      "0x44d4d830788cc6D4d72C78203F5918a3E2761691",
    "Old Address, Large GTC Transfers 6":
      "0x38661187CfD779bEa00e14Bc5b986CF0C717A39B",
    "Old Address, Large GTC Transfers 7":
      "0x34237F91D2Ce322f3572376b82472C7FA56D7595",
    "Old Address, Large GTC Transfers 8":
      "0x2083e7B107347AE4F5Cb6Ff35EC5DAcf03391c57",
    "Old Address, Large GTC Transfers 9":
      "0x183a1CaF6750CF88E45812FCE0110D59d71833e4",
    "Old Address, Large GTC Transfers 10":
      "0x11e06eF6e42306dc40D2754Ef2629fB011d80aE9",
  },
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
  [DaoIdEnum.NOUNS]: {},
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
  [DaoIdEnum.TEST]: {
    // Major centralized exchanges (CEX) - Alice and Bob for comprehensive coverage
    Alice_CEX: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Alice as CEX
    Bob_CEX: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Bob as CEX
    // ENS contract addresses for completeness
    ENSToken: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    ENSGovernor: "0x7c28FC9709650D49c8d0aED2f6ece6b191F192a9",
    ENSTimelock: "0xa7E99C1df635d13d61F7c81eCe571cc952E64526",
  },
  [DaoIdEnum.GTC]: {
    "Binance 1": "0xF977814e90dA44bFA03b6295A0616a897441aceC",
    "Binance 2": "0x28C6c06298d514Db089934071355E5743bf21d60",
    "Binance 3": "0x5a52E96BAcdaBb82fd05763E25335261B270Efcb",
    "Binance 4": "0xDFd5293D8e347dFe59E90eFd55b2956a1343963d",
    "Binance 5": "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549",
    Bithumb: "0x74be0CF1c9972C00ed4EF290e0E5BCFd18873f13",
    Upbit: "0x74be0CF1c9972C00ed4EF290e0E5BCFd18873f13",
    "Upbit 2": "0xeDAe8A6cBA6867a0B7e565C21eaBAEe3D550fd9d",
    "Coinbase 1": "0x237eF9564D74A1056c1A276B03C66055Fa61A700",
    "Coinbase 2": "0x31Bc777E72A0A7F90cC7b1ec52eACeC806B27563",
    "Coinbase 3": "0x11aC4fE470Cf8B5b3de59B31261030BD8514892d",
    "Coinbase 4": "0x271Ac4A385F689f00D01716877e827702231447e",
    "Coinbase 5": "0x4a630c042B2b07a0641d487b0Ccf5af36800415e",
    "Coinbase 6": "0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43",
    Kraken: "0x310E035d176ccB589511eD16af7aE7BAc4fc7f83",
    "Kraken 2": "0xC06f25517E906b7F9B4deC3C7889503Bb00b3370",
    "Kraken 3": "0x22af984f13DFB5C80145E3F9eE1050Ae5a5FB651",
    "Crypto.com": "0xCFFAd3200574698b78f32232aa9D63eABD290703",
    "Crypto.com 2": "0xA023f08c70A23aBc7EdFc5B6b5E171d78dFc947e",
    "Crypto.com 3": "0x46340b20830761efd32832A74d7169B29FEB9758",
    Kucoin: "0x58edF78281334335EfFa23101bBe3371b6a36A51",
    "Kucoin 2": "0xD6216fC19DB775Df9774a6E33526131dA7D19a2c",
    Bittavo: "0xaB782bc7D4a2b306825de5a7730034F8F63ee1bC",
    MEXC: "0x9642b23Ed1E01Df1092B92641051881a322F5D4E",
    "MEXC 2": "0x75e89d5979E4f6Fba9F97c104c2F0AFB3F1dcB88",
    Gate: "0x0D0707963952f2fBA59dD06f2b425ace40b492Fe",
    BingX: "0xC3dcd744db3f114f0edF03682b807b78A227Bf74",
    Bitget: "0x5bdf85216ec1e38D6458C870992A69e38e03F7Ef",
    CoinEx: "0x38f6d5fb32f970Fe60924B282704899411126336",
    Bitpanda: "0x0529ea5885702715e83923c59746ae8734c553B7",
  },
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
  [DaoIdEnum.NOUNS]: {},
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
  [DaoIdEnum.TEST]: {
    // DEX pools - Charlie and David for comprehensive coverage
    Charlie_DEX_Pool: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Charlie as DEX
    David_DEX_Pool: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // David as DEX
    // ENS contract addresses involved in DEX-like operations
    ENSToken: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    ENSTimelock: "0xa7E99C1df635d13d61F7c81eCe571cc952E64526",
  },
  [DaoIdEnum.GTC]: {
    Uniswap: "0xD017617f6F0fD22796E137a8240cc38F52a147B2",
  },
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
  [DaoIdEnum.NOUNS]: {},
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
  [DaoIdEnum.TEST]: {
    // Lending protocols - different addresses for comprehensive flag coverage
    Alice_Lending_Protocol: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Alice as lending
    Charlie_Lending_Pool: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Charlie as lending
    // ENS contract addresses involved in lending-like operations
    ENSGovernor: "0x7c28FC9709650D49c8d0aED2f6ece6b191F192a9",
    ENSTimelock: "0xa7E99C1df635d13d61F7c81eCe571cc952E64526",
  },
  [DaoIdEnum.GTC]: {},
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
  [DaoIdEnum.GTC]: {
    ZeroAddress: zeroAddress,
    Dead: "0x0000000000000000000000000000000000000000",
    TokenContract: "0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F",
  },
  [DaoIdEnum.NOUNS]: {
    ZeroAddress: zeroAddress,
    Dead: "0x0000000000000000000000000000000000000000",
    TokenContract: "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03",
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

export const metricTypeArray = Object.values(MetricTypesEnum);
