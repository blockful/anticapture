import { Address, zeroAddress } from "viem";

import { DaoIdEnum } from "./enums";

export const DAYS_IN_YEAR = 365;

export const CONTRACT_ADDRESSES = {
  [DaoIdEnum.UNI]: {
    blockTime: 12,
    tokenType: "ERC20",
    // https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
    token: {
      address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      decimals: 18,
      startBlock: 10861674,
    },
    // https://etherscan.io/address/0x408ED6354d4973f66138C91495F2f2FCbd8724C3
    governor: {
      address: "0x408ed6354d4973f66138c91495f2f2fcbd8724c3",
      startBlock: 13059157,
    },
  },
  [DaoIdEnum.ENS]: {
    blockTime: 12,
    tokenType: "ERC20",
    // https://etherscan.io/address/0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72
    token: {
      address: "0xc18360217d8f7ab5e7c516566761ea12ce7f9d72",
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
      address: "0x912ce59144191c1204e64559fe8253a0e49e6548",
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
      address: "0xcdf27f107725988f2261ce2256bdfcde8b382b10",
      startBlock: 71801427,
    },
  },
  [DaoIdEnum.TEST]: {
    blockTime: 12,
    tokenType: "ERC20",
    token: {
      address: "0x244de6b06e7087110b94cde88a42d9aba17efa52",
      decimals: 18,
      startBlock: 22635098,
    },
    governor: {
      address: "0x7c28fc9709650d49c8d0aed2f6ece6b191f192a9",
      startBlock: 22635098,
    },
  },
  [DaoIdEnum.GTC]: {
    blockTime: 12,
    // https://etherscan.io/address/0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F
    tokenType: "ERC20",
    token: {
      address: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
      decimals: 18,
      startBlock: 12422079,
    },
    // https://etherscan.io/address/0x9D4C63565D5618310271bF3F3c01b2954C1D1639
    governor: {
      address: "0x9d4c63565d5618310271bf3f3c01b2954c1d1639",
      startBlock: 17813942,
    },
    // https://etherscan.io/address/0xDbD27635A534A3d3169Ef0498beB56Fb9c937489
    governorAlpha: {
      address: "0xdbd27635a534a3d3169ef0498beb56fb9c937489",
      startBlock: 12497481,
    },
  },
  [DaoIdEnum.NOUNS]: {
    blockTime: 12,
    tokenType: "ERC721",
    token: {
      // https://etherscan.io/token/0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03
      address: "0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03",
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
      address: "0x830bd73e4184cef73443c15111a1df14e495c706",
      startBlock: 12985451,
    },
  },
  [DaoIdEnum.SCR]: {
    blockTime: 1.5,
    // https://scrollscan.com/address/0xd29687c813D741E2F938F4aC377128810E217b1b
    tokenType: "ERC20",
    token: {
      address: "0xd29687c813d741e2f938f4ac377128810e217b1b",
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
      address: "0xc00e94cb662c3520282e6f5717214004a7f26888",
      decimals: 18,
      startBlock: 9601359,
    },
    // https://etherscan.io/address/0x309a862bbC1A00e45506cB8A802D1ff10004c8C0
    governor: {
      address: "0x309a862bbc1a00e45506cb8a802d1ff10004c8c0",
      startBlock: 21688680,
    },
  },
  [DaoIdEnum.OBOL]: {
    blockTime: 12,
    tokenType: "ERC20",
    // https://etherscan.io/address/0x0B010000b7624eb9B3DfBC279673C76E9D29D5F7
    // Token created: Sep-19-2022 11:12:47 PM UTC
    token: {
      address: "0x0b010000b7624eb9b3dfbc279673c76e9d29d5f7",
      decimals: 18,
      startBlock: 15570746,
    },
    // https://etherscan.io/address/0xcB1622185A0c62A80494bEde05Ba95ef29Fbf85c
    // Governor created: Feb-19-2025 10:34:47 PM UTC
    governor: {
      address: "0xcb1622185a0c62a80494bede05ba95ef29fbf85c",
      startBlock: 21883431,
    },
  },
  [DaoIdEnum.ZK]: {
    blockTime: 1,
    tokenType: "ERC20",
    // https://explorer.zksync.io/address/0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E
    token: {
      address: "0x5a7d6b2f92c77fad6ccabd7ee0624e64907eaf3e",
      decimals: 18,
      startBlock: 34572100,
    },
    // https://explorer.zksync.io/address/0xb83FF6501214ddF40C91C9565d095400f3F45746
    governor: {
      address: "0xb83ff6501214ddf40c91c9565d095400f3f45746",
      startBlock: 55519658,
    },
  },
} as const;

export const TreasuryAddresses: Record<DaoIdEnum, Record<string, Address>> = {
  [DaoIdEnum.UNI]: {
    timelock: "0x1a9c8182c09f50c8318d769245bea52c32be35bc",
    treasuryVester1: "0x4750c43867ef5f89869132eccf19b9b6c4286e1a",
    treasuryVester2: "0xe3953d9d317b834592ab58ab2c7a6ad22b54075d",
    treasuryVester3: "0x4b4e140d1f131fdad6fb59c13af796fd194e4135",
    treasuryVester4: "0x3d30b1ab88d487b0f3061f40de76845bec3f1e94",
  },
  [DaoIdEnum.ENS]: {
    timelock: "0xfe89cc7abb2c4183683ab71653c4cdc9b02d44b7",
    endaoment: "0x4f2083f5fbede34c2714affb3105539775f7fe64",
    oldEthRegistrarController: "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5",
    ethRegistrarController: "0x253553366da8546fc250f225fe3d25d0c782303b",
  },
  [DaoIdEnum.ARB]: {},
  [DaoIdEnum.OP]: {},
  [DaoIdEnum.NOUNS]: {
    timelock: "0xb1a32fc9f9d8b2cf86c068cae13108809547ef71",
    auction: "0x830bd73e4184cef73443c15111a1df14e495c706",
  },
  [DaoIdEnum.TEST]: {},
  [DaoIdEnum.GTC]: {
    "Gitcoin Timelock": "0x57a8865cfb1ecef7253c27da6b4bc3daee5be518",
    "Gitcoin CSDO": "0x931896a8a9313f622a2afca76d1471b97955e551",
    "Gitcoin Fraud Detection & Defense":
      "0xd4567069c5a1c1fc8261d8ff5c0b1d98f069cf47",
    "Gitcoin Grants Matching Pool":
      "0xde21f729137c5af1b01d73af1dc21effa2b8a0d6",
    "Gitcoin Merch, Memes and Marketing":
      "0xc23da3ca9300571b9cf43298228353cbb3e1b4c0",
    "Gitcoin Timelock Transfer 1": "0x6eede31a2a15340342b4bcb3039447d457ac7c4b",
    "Gitcoin Timelock Transfer 2": "0xed95d629c4db80060c59432e81254d256aec97e2",
    "Vesting Address GTC 1": "0x2aa5d15eb36e5960d056e8fea6e7bb3e2a06a351",
    "Staking contract GTC": "0x0e3efd5be54cc0f4c64e0d186b0af4b7f2a0e95f",
    "OKX Ventures": "0xe527bbde3654e9ba824f9b72dff495eee60fd366",
    "Protocol Labs 1": "0x154855f5522f6b04ce654175368f428852dcd55d",
    "Matt Solomon": "0x7ad3d9819b06e800f8a65f3440d599a23d6a0bdf",
    "Arbitrum Bridge": "0xa3a7b6f88361f48403514059f1f16c8e78d60eec",
    "Optimism Bridge": "0x99c9fc46f92e8a1c0dec1b1747d010903e884be1",
    "Radicle Timelock": "0x8da8f82d2bbdd896822de723f55d6edf416130ba",
    "Vesting Address GTC 3": "0x2cde9919e81b20b4b33dd562a48a84b54c48f00c",
    "deltajuliet.eth 1": "0x5b1ddbec956ed39e1ac92ae3c3d99295ddd59865",
    "deltajuliet.eth 2": "0x407466c56b8488c4d99558633ff1ac5d84400b46",
    "deltajuliet.eth 3": "0x14b9f70c3d4b367d496f3771eda7efa65282e55d",
    "deltajuliet.eth 4": "0x0dcfc9323539a6ec47f9bc0a96882070540bf950",
    "deltajuliet.eth 5": "0x08f3fb287aec4e06eff8de37410eaf52b05c7f56",
    "Gitcoin Timelock Transfer 5": "0x9e75c3bfb82cf701ac0a74d6c1607461ec65eff9",
    "Old Address, Large GTC Transfers 1":
      "0xf5a7ba226cb94d87c29add2b59ac960904a163f3",
    "Old Address, Large GTC Transfers 2":
      "0xed865c87c3509e3a908655777b13f7313b2fc196",
    "Old Address, Large GTC Transfers 3":
      "0xdd6a165b9e05549640149df108ac0af8579b7005",
    "Old Address, Large GTC Transfers 4":
      "0xad467e6039f0ca383b5ffd60f1c7a890acab4be3",
    "Old Address, Large GTC Transfers 5":
      "0x44d4d830788cc6d4d72c78203f5918a3e2761691",
    "Old Address, Large GTC Transfers 6":
      "0x38661187cfd779bea00e14bc5b986cf0c717a39b",
    "Old Address, Large GTC Transfers 7":
      "0x34237f91d2ce322f3572376b82472c7fa56d7595",
    "Old Address, Large GTC Transfers 8":
      "0x2083e7b107347ae4f5cb6ff35ec5dacf03391c57",
    "Old Address, Large GTC Transfers 9":
      "0x183a1caf6750cf88e45812fce0110d59d71833e4",
    "Old Address, Large GTC Transfers 10":
      "0x11e06ef6e42306dc40d2754ef2629fb011d80ae9",
  },
  [DaoIdEnum.SCR]: {
    "DAO Treasury": "0x4cb06982dd097633426cf32038d9f1182a9ada0c",
    "Foundation Treasury": "0xff120e015777e9aa9f1417a4009a65d2eda78c13",
    "Ecosystem Treasury": "0xee198f4a91e5b05022dc90535729b2545d3b03df",
  },
  [DaoIdEnum.COMP]: {
    Timelock: "0x6d903f6003cca6255d85cca4d3b5e5146dc33925",
    Comptroller: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
    /// v2 markets
    v2WBTC: "0xccf4429db6322d5c611ee964527d42e5d685dd6a",
    v2USDC: "0x39aa39c021dfbae8fac545936693ac917d5e7563",
    v2DAI: "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643",
    v2USDT: "0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9",
    v2ETH: "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5",
    v2UNI: "0x35a18000230da775cac24873d00ff85bccded550",
    v2BAT: "0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e",
    v2LINK: "0xface851a4921ce59e912d19329929ce6da6eb0c7",
    v2TUSD: "0x12392f67bdf24fae0af363c24ac620a2f67dad86",
    v2AAVE: "0xe65cdb6479bac1e22340e4e755fae7e509ecd06c",
    v2COMP: "0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4",
    ///v3 markets
    //Ethereum markets
    mainnetETH: "0xa17581a9e3356d9a858b789d68b4d866e593ae94",
    mainnetstETH: "0x3d0bb1ccab520a66e607822fc55bc921738fafe3",
    mainnetUSDT: "0x3afdc9bca9213a35503b077a6072f3d0d5ab0840",
    mainnetUSDS: "0x5d409e56d886231adaf00c8775665ad0f9897b56",
    mainnetUSDC: "0xc3d688b66703497daa19211eedff47f25384cdc3",
    mainnetWBTC: "0xe85dc543813b8c2cfeaac371517b925a166a9293",
    // Optimism markets
    opETH: "0xe36a30d249f7761327fd973001a32010b521b6fd",
    opUSDT: "0x995e394b8b2437ac8ce61ee0bc610d617962b214",
    opUSDC: "0x2e44e174f7d53f0212823acc11c01a11d58c5bcb",
    // Unichain markets
    uniUSDC: "0x2c7118c4c88b9841fcf839074c26ae8f035f2921",
    uniETH: "0x6c987dde50db1dcdd32cd4175778c2a291978e2a",
    // Polygon markets
    polyUSDT0: "0xaeb318360f27748acb200ce616e389a6c9409a07",
    polyUSDC: "0xf25212e676d1f7f89cd72ffee66158f541246445",
    // Ronin markets
    ronWETH: "0x4006ed4097ee51c09a04c3b0951d28ccf19e6dfe",
    ronRON: "0xc0afdbd1ceb621ef576ba969ce9d4cef78dbc0c0",
    // Mantle markets
    manUSDe: "0x606174f62cd968d8e684c645080fa694c1d7786e",
    // Base markets
    manUSDbC: "0x9c4ec768c28520b50860ea7a15bd7213a9ff58bf",
    manUSDC: "0xb125e6687d4313864e53df431d5425969c15eb2f",
    manAERO: "0x784efeb622244d2348d4f2522f8860b96fbece89",
    manUSDS: "0x2c776041ccfe903071af44aa147368a9c8eea518",
    manETH: "0x46e6b214b524310239732d51387075e0e70970bf",
    // Arbitrum marketsVOTE
    arbUSDT0: "0xd98be00b5d27fc98112bde293e487f8d4ca57d07",
    arbUSDC: "0x9c4ec768c28520b50860ea7a15bd7213a9ff58bf",
    "arbUSDC.e": "0xa5edbdd9646f8dff606d7448e414884c7d905dca",
    arbETH: "0x6f7d514bbd4aff3bcd1140b7344b32f063dee486",
    // Linea markets
    linUSDC: "0x8d38a3d6b3c3b7d96d6536da7eef94a9d7dbc991",
    linETH: "0x60f2058379716a64a7a5d29219397e79bc552194",
    // Scroll markets
    scrUSDC: "0xb2f97c1bd3bf02f5e74d13f02e3e26f93d77ce44",
  },
  [DaoIdEnum.OBOL]: {
    timelock: "0xcdbf527842ab04da548d33eb09d03db831381fb0",
    "Ecosystem Treasury 1": "0x42d201cc4d9c1e31c032397f54cace2f48c1fa72",
    "Ecosystem Treasury 2": "0x54076088be86943e27b99120c5905aad8a1bd166",
    "Staking Rewards Reserve": "0x33f3d61415784a5899b733976b0c1f9176051569",
    "OBOL Incentives Reserve": "0xdc8a309111ab0574ca51ca9c7dd0152738e4c374",
    "Protocol Revenue": "0xde5ae4de36c966747ea7df13bd9589642e2b1d0d",
    "Grant Program": "0xa59f60a7684a69e63c07bec087cec3d0607cd5ce",
    "DV Labs Treasury 2": "0x6befb6484aa10187947dda81fc01e495f7168db4",
  },
  [DaoIdEnum.ZK]: {
    timelock: "0xe5d21a9179ca2e1f0f327d598d464ccf60d89c3d",
  },
};

export const CEXAddresses: Record<DaoIdEnum, Record<string, Address>> = {
  [DaoIdEnum.UNI]: {
    BinanceHotWallet: "0x5a52e96bacdabb82fd05763e25335261b270efcb",
    BinanceHotWallet2: "0x28c6c06298d514db089934071355e5743bf21d60",
    BinanceHotWallet3: "0x8894e0a0c962cb723c1976a4421c95949be2d4e3",
    BinanceHotWallet4: "0x43684d03d81d3a4c70da68febdd61029d426f042",
    BinanceHotWallet5: "0x21a31ee1afc51d94c2efccaa2092ad1028285549",
    BinanceHotWallet6: "0xdfd5293d8e347dfe59e90efd55b2956a1343963d",
    BinanceUSHotWallet: "0x21d45650db732ce5df77685d6021d7d5d1da807f",
    BinanceColdWallet: "0xf977814e90da44bfa03b6295a0616a897441acec",
    BinancePegTokenFunds: "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503",
    Robinhood: "0x73af3bcf944a6559933396c1577b257e2054d935",
    AnchorageDigital1: "0x985de23260743c2c2f09bfdec50b048c7a18c461",
    AnchorageDigital2: "0xfad67fbdb7d4d8569671b8aa4a09f6a90d692ed7",
    BybitColdWallet1: "0x88a1493366d48225fc3cefbdae9ebb23e323ade3",
    UpbitDeposit: "0xaccfea7d9e618f60ce1347c52ae206262412aa4a",
    UpbitColdWallet: "0x245445940b317e509002eb682e03f4429184059d",
    KrakenColdWallet: "0xda9dfa130df4de4673b89022ee50ff26f6ea73cf",
    KrakenHotWallet: "0x4c6007e38ce164ed80ff8ff94192225fcdac68cd",
    KrakenHotWallet2: "0x0a332d03367366dd5fd3a554ef8f8b47ed36e591",
    Robinhood2: "0x2efb50e952580f4ff32d8d2122853432bbf2e204",
    GeminiColdWallet: "0xafcd96e580138cfa2332c632e66308eacd45c5da",
    KrakenColdWallet2: "0xc06f25517e906b7f9b4dec3c7889503bb00b3370",
    CoinbaseColdWallet: "0x6cc8fff60a60ab0373fb3072f0b846450a8fa443",
    NobitexIrHotWallet: "0xf639d88a89384a4d97f2ba9159567ddb3890ea07",
    MEXCHotWallet: "0x4982085c9e2f89f2ecb8131eca71afad896e89cb",
    MEXCHotWallet2: "0x2e8f79ad740de90dc5f5a9f0d8d9661a60725e64",
    OKXHotWallet: "0x6cc5f688a315f3dc28a7781717a9a798a59fda7b",
    StakeComHotWallet: "0xfa500178de024bf43cfa69b7e636a28ab68f2741",
    BinanceWithdrawalHotWallet: "0xe2fc31f816a9b94326492132018c3aecc4a93ae1",
    NobitexIrHotWallet2: "0xd582c78a04e7379dfc9ee991a25f549576962ee1",
  },
  [DaoIdEnum.ENS]: {
    BinanceHotWallet: "0x5a52e96bacdabb82fd05763e25335261b270efcb",
    BinanceHotWallet2: "0x28c6c06298d514db089934071355e5743bf21d60",
    BinanceHotWallet3: "0x8894e0a0c962cb723c1976a4421c95949be2d4e3",
    BinanceHotWallet4: "0x43684d03d81d3a4c70da68febdd61029d426f042",
    BinanceHotWallet5: "0x21a31ee1afc51d94c2efccaa2092ad1028285549",
    BinanceHotWallet6: "0xdfd5293d8e347dfe59e90efd55b2956a1343963d",
    BinanceUSHotWallet: "0x21d45650db732ce5df77685d6021d7d5d1da807f",
    BitThumbHotWallet: "0x498697892fd0e5e3a16bd40d7bf2644f33cbbbd4",
    BybitColdWallet1: "0x88a1493366d48225fc3cefbdae9ebb23e323ade3",
    ByBitHotWallet: "0xf89d7b9c864f589bbf53a82105107622b35eaa40",
    BtcTurkColdWallet: "0x76ec5a0d3632b2133d9f1980903305b62678fbd3",
    BitGetHotWallet: "0x5bdf85216ec1e38d6458c870992a69e38e03f7ef",
    CryptoComHotWallet: "0xa023f08c70a23abc7edfc5b6b5e171d78dfc947e",
    CryptoComHotWallet2: "0xcffad3200574698b78f32232aa9d63eabd290703",
    BitThumbHotWallet2: "0x10522336d85cb52628c84e06cb05f79011fef585",
    ParibuColdWallet: "0xa23cbcdfafd09de2ce793d0a08f51865885be3f5",
    CoinOneHotWallet: "0x167a9333bf582556f35bd4d16a7e80e191aa6476",
    BitvavoColdWallet: "0xc419733ba8f13d8605141cac8f681f5a0abc0122",
    KuCoinHotWallet: "0xd6216fc19db775df9774a6e33526131da7d19a2c",
    BitvavoColdWallet2: "0xedc6bacdc1e29d7c5fa6f6eca6fdd447b9c487c9",
    CoinbaseHotWallet: "0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43",
    MEXCHotWallet3: "0x3cc936b795a188f0e246cbb2d74c5bd190aecf18",
    KuCoinColdWallet: "0x2933782b5a8d72f2754103d1489614f29bfa4625",
    UpbitColdWallet: "0x245445940b317e509002eb682e03f4429184059d",
  },
  [DaoIdEnum.ARB]: {},
  [DaoIdEnum.NOUNS]: {},
  [DaoIdEnum.OP]: {
    "Binance 1": "0xf977814e90da44bfa03b6295a0616a897441acec",
    "Binance 2": "0x5a52e96bacdabb82fd05763e25335261b270efcb",
    OKX: "0x611f7bf868a6212f871e89f7e44684045ddfb09d",
    Bybit: "0xf89d7b9c864f589bbf53a82105107622b35eaa40",
    "Bybit 2": "0x88a1493366d48225fc3cefbdae9ebb23e323ade3",
    Bithumb: "0xb18fe4b95b7d633c83689b5ed3ac4ad0a857a2a7",
    MEXC: "0xdf90c9b995a3b10a5b8570a47101e6c6a29eb945",
    Gate: "0xc882b111a75c0c657fc507c04fbfcd2cc984f071",
    "Kraken 1": "0x2a62c4acca1a166ee582877112682cae8cc0ffe7",
    "Kraken 2": "0xc06f25517e906b7f9b4dec3c7889503bb00b3370",
    "Bitkub 1": "0xda4231ef1768176536eee3ec187315e60572bbd4",
    "Bitkub 2": "0x7a1cf8ce543f4838c964fb14d403cc6ed0bdbacc",
    Bitget: "0x5bdf85216ec1e38d6458c870992a69e38e03f7ef",
    "Kucoin 1": "0x2933782b5a8d72f2754103d1489614f29bfa4625",
    "Kucoin 2": "0xc1274c580c5653cdf8246695c2e0112492a99d6f",
    "Kucoin 3": "0xa3f45e619ce3aae2fa5f8244439a66b203b78bcc",
    "Coinbase 1": "0xc8373edfad6d5c5f600b6b2507f78431c5271ff5",
    "Coinbase 2": "0xd839c179a4606f46abd7a757f7bb77d7593ae249",
    "Crypto.com 1": "0x8a161a996617f130d0f37478483afc8c1914db6d",
    "Crypto.com 2": "0x92bd687953da50855aee2df0cff282cc2d5f226b",
    "Btcturk 1": "0xde2faca4bbc0aca08ff04d387c39b6f6325bf82a",
    "Btcturk 2": "0xb5a46bc8b76fd2825aeb43db9c9e89e89158ecde",
    "Bitpanda 1": "0xb1a63489469868dd1d0004922c36d5079d6331c6",
    "Bitpanda 2": "0x5e8c4499fdd78a5efe998b3abf78658e02bb7702",
    "Bitpanda 3": "0x0529ea5885702715e83923c59746ae8734c553b7",
    "BingX 1": "0xc3dcd744db3f114f0edf03682b807b78a227bf74",
    "Bingx 2": "0x0b07f64abc342b68aec57c0936e4b6fd4452967e",
    "HTX 1": "0xe0b7a39fef902c21bad124b144c62e7f85f5f5fa",
    "HTX 2": "0xd3cc0c7d40366a061397274eae7c387d840e6ff8",
    Bitbank: "0x3727cfcbd85390bb11b3ff421878123adb866be8",
    Revolut: "0x9b0c45d46d386cedd98873168c36efd0dcba8d46",
    "Paribu 1": "0xc80afd311c9626528de66d86814770361fe92416",
    Coinspot: "0xf35a6bd6e0459a4b53a27862c51a2a7292b383d1",
    "Bitvavo 1": "0x48eca43db3a3ca192a5fb9b20f4fc4d96017af0f",
    SwissBorg: "0x28cc933fecf280e720299b1258e8680355d8841f",
    "Coinbase Prime": "0xdfd76bbfeb9eb8322f3696d3567e03f894c40d6c",
    "Binance US": "0x43c5b1c2be8ef194a509cf93eb1ab3dbd07b97ed",
    "Bitstamp 1": "0x7c43e0270c868d0341c636a38c07e5ae93908a04",
    "Bitstamp 2": "0x4c2eeb203ddc70291e33796527de4272ac9fafc1",
    "Coinhako 1": "0xe66baa0b612003af308d78f066bbdb9a5e00ff6c",
    "Coinhako 2": "0xe66baa0b612003af308d78f066bbdb9a5e00ff6c",
    Bitfinex: "0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec",
    "Woo Network": "0x63dfe4e34a3bfc00eb0220786238a7c6cef8ffc4",
    Koribit: "0xf0bc8fddb1f358cef470d63f96ae65b1d7914953",
    "Indodax 1": "0x3c02290922a3618a4646e3bbca65853ea45fe7c6",
    "Indodax 2": "0x91dca37856240e5e1906222ec79278b16420dc92",
  },
  [DaoIdEnum.TEST]: {
    // Major centralized exchanges (CEX) - Alice and Bob for comprehensive coverage
    Alice_CEX: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", // Alice as CEX
    Bob_CEX: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", // Bob as CEX
    // ENS contract addresses for completeness
    ENSToken: "0x244de6b06e7087110b94cde88a42d9aba17efa52",
    ENSGovernor: "0x7c28fc9709650d49c8d0aed2f6ece6b191f192a9",
    ENSTimelock: "0xa7e99c1df635d13d61f7c81ece571cc952e64526",
  },
  [DaoIdEnum.GTC]: {
    "Binance 1": "0xf977814e90da44bfa03b6295a0616a897441acec",
    "Binance 2": "0x28c6c06298d514db089934071355e5743bf21d60",
    "Binance 3": "0x5a52e96bacdabb82fd05763e25335261b270efcb",
    "Binance 4": "0xdfd5293d8e347dfe59e90efd55b2956a1343963d",
    "Binance 5": "0x21a31ee1afc51d94c2efccaa2092ad1028285549",
    Bithumb: "0x74be0cf1c9972c00ed4ef290e0e5bcfd18873f13",
    Upbit: "0x74be0cf1c9972c00ed4ef290e0e5bcfd18873f13",
    "Upbit 2": "0xedae8a6cba6867a0b7e565c21eabaee3d550fd9d",
    "Coinbase 1": "0x237ef9564d74a1056c1a276b03c66055fa61a700",
    "Coinbase 2": "0x31bc777e72a0a7f90cc7b1ec52eacec806b27563",
    "Coinbase 3": "0x11ac4fe470cf8b5b3de59b31261030bd8514892d",
    "Coinbase 4": "0x271ac4a385f689f00d01716877e827702231447e",
    "Coinbase 5": "0x4a630c042b2b07a0641d487b0ccf5af36800415e",
    "Coinbase 6": "0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43",
    Kraken: "0x310e035d176ccb589511ed16af7ae7bac4fc7f83",
    "Kraken 2": "0xc06f25517e906b7f9b4dec3c7889503bb00b3370",
    "Kraken 3": "0x22af984f13dfb5c80145e3f9ee1050ae5a5fb651",
    "Crypto.com": "0xcffad3200574698b78f32232aa9d63eabd290703",
    "Crypto.com 2": "0xa023f08c70a23abc7edfc5b6b5e171d78dfc947e",
    "Crypto.com 3": "0x46340b20830761efd32832a74d7169b29feb9758",
    Kucoin: "0x58edf78281334335effa23101bbe3371b6a36a51",
    "Kucoin 2": "0xd6216fc19db775df9774a6e33526131da7d19a2c",
    Bittavo: "0xab782bc7d4a2b306825de5a7730034f8f63ee1bc",
    MEXC: "0x9642b23ed1e01df1092b92641051881a322f5d4e",
    "MEXC 2": "0x75e89d5979e4f6fba9f97c104c2f0afb3f1dcb88",
    Gate: "0x0d0707963952f2fba59dd06f2b425ace40b492fe",
    BingX: "0xc3dcd744db3f114f0edf03682b807b78a227bf74",
    Bitget: "0x5bdf85216ec1e38d6458c870992a69e38e03f7ef",
    CoinEx: "0x38f6d5fb32f970fe60924b282704899411126336",
    Bitpanda: "0x0529ea5885702715e83923c59746ae8734c553b7",
  },
  [DaoIdEnum.SCR]: {
    "Binance 2": "0x98adef6f2ac8572ec48965509d69a8dd5e8bba9d",
    "Binance 3": "0x687b50a70d33d71f9a82dd330b8c091e4d772508",
    "Gate 2": "0xc882b111a75c0c657fc507c04fbfcd2cc984f071",
    "OKX 2": "0xb0a27099582833c0cb8c7a0565759ff145113d64",
    Binance: "0xf977814e90da44bfa03b6295a0616a897441acec",
    BingX: "0x2b3bf74b29f59fb8dda41cf3d6a8da28cf8e7921",
    Bitget: "0x1ab4973a48dc892cd9971ece8e01dcc7688f8f23",
    Bitpanda: "0x0529ea5885702715e83923c59746ae8734c553b7",
    Bybit: "0xf89d7b9c864f589bbf53a82105107622b35eaa40",
    Gate: "0x0d0707963952f2fba59dd06f2b425ace40b492fe",
    Kucoin: "0x2933782b5a8d72f2754103d1489614f29bfa4625",
    OKX: "0x611f7bf868a6212f871e89f7e44684045ddfb09d",
  },
  [DaoIdEnum.COMP]: {
    Robinhood: "0x73af3bcf944a6559933396c1577b257e2054d935",
    "Robinhood 2": "0x841ed663f2636863d40be4ee76243377dff13a34",
    "Binance 1": "0xf977814e90da44bfa03b6295a0616a897441acec",
    "Binance 2": "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503",
    "Binance 3": "0x28c6c06298d514db089934071355e5743bf21d60",
    "Binance 4": "0x21a31ee1afc51d94c2efccaa2092ad1028285549",
    "Binance 5": "0xdfd5293d8e347dfe59e90efd55b2956a1343963d",
    ByBit: "0x6522b7f9d481eceb96557f44753a4b893f837e90",
    OKX: "0x073f564419b625a45d8aea3bb0de4d5647113ad7",
    Upbit: "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503",
    BtcTurk: "0x76ec5a0d3632b2133d9f1980903305b62678fbd3",
    Bithumb: "0x75252a69676c2472edf9974476e9c636ca7a8af1",
    Kraken: "0x7dafba1d69f6c01ae7567ffd7b046ca03b706f83",
    "Kraken 2": "0xd2dd7b597fd2435b6db61ddf48544fd931e6869f",
    "Kucoin 1": "0x2933782b5a8d72f2754103d1489614f29bfa4625",
    "Kucoin 2": "0x58edf78281334335effa23101bbe3371b6a36a51",
  },
  [DaoIdEnum.OBOL]: {
    "Bybit Hot Wallet": "0xa31231e727ca53ff95f0d00a06c645110c4ab647",
    "Binance Wallet": "0x93deb693b170d56bdde1b0a5222b14c0f885d976",
    "Gate Cold Wallet": "0xc882b111a75c0c657fc507c04fbfcd2cc984f071",
    "Gate Hot Wallet": "0x0d0707963952f2fba59dd06f2b425ace40b492fe",
    "MEXC Hot Wallet": "0x9642b23ed1e01df1092b92641051881a322f5d4e",
    "Binance Wallet Proxy": "0x73d8bd54f7cf5fab43fe4ef40a62d390644946db",
  },
  [DaoIdEnum.ZK]: {
    "Binance 1": "0xf977814e90da44bfa03b6295a0616a897441acec",
    "Binance 2": "0x7aed074ca56f5050d5a2e512ecc5bf7103937d76",
    "Binance 3": "0xa84fd90d8640fa63d194601e0b2d1c9094297083",
    "Binance 4": "0x43684d03d81d3a4c70da68febdd61029d426f042",
    "Binance 5": "0x98adef6f2ac8572ec48965509d69a8dd5e8bba9d",
    Bybit: "0xacf9a5610cb9e6ec9c84ca7429815e95b6607e9f",
    OKX1: "0x611f7bf868a6212f871e89f7e44684045ddfb09d",
    BtcTurk: "0x7aed074ca56f5050d5a2e512ecc5bf7103937d76",
    MEXC: "0xfe4931fb4deabc515f1a48b94b6b17653eeaa34f",
    Bitget: "0x97b9d2102a9a65a26e1ee82d59e42d1b73b68689",
    Kraken: "0xd2dd7b597fd2435b6db61ddf48544fd931e6869f",
    Kucoin: "0xd6216fc19db775df9774a6e33526131da7d19a2c",
    "Kucoin 2": "0x2933782b5a8d72f2754103d1489614f29bfa4625",
    Gate: "0x0d0707963952f2fba59dd06f2b425ace40b492fe",
    "Gate 2": "0xc882b111a75c0c657fc507c04fbfcd2cc984f071",
    "Crypto.com": "0x2a584c02de672425729af2f174fb19fe734dde5d",
    OKX2: "0xf9b52be2426f06ab6d560f64a7b15e820f33cbdb",
    OKX3: "0xecf17c7f6a6090f1edd21e0beb2268197270fb44",
  },
};

export const DEXAddresses: Record<DaoIdEnum, Record<string, Address>> = {
  [DaoIdEnum.UNI]: {
    // ArbitrumL1ERC20Gateway: "0xa3a7b6f88361f48403514059f1f16c8e78d60eec",
    Uniswap_UNI_ETH_V3_03: "0x1d42064fc4beb5f8aaf85f4617ae8b3b5b8bd801",
    Uniswap_UNI_ETH_V3_1: "0x360b9726186c0f62cc719450685ce70280774dc8",
    Uniswap_UNI_ETH_V2_03: "0xd3d2e2692501a5c9ca623199d38826e513033a17",
    Uniswap_UNI_USDT_V3_03: "0x3470447f3cecffac709d3e783a307790b0208d60",
    Uniswap_UNI_AAVE_V3_03: "0x59c38b6775ded821f010dbd30ecabdcf84e04756",
    Uniswap_UNI_USDC_V3_03: "0xd0fc8ba7e267f2bc56044a7715a489d851dc6d78",
    Uniswap_UNI_WBTC_V3_03: "0x8f0cb37cdff37e004e0088f563e5fe39e05ccc5b",
    Uniswap_UNI_LINK_V3_1: "0xa6b9a13b34db2a00284299c47dacf49fb62c1755",
    Uniswap_UNI_1INCH_V3_1: "0x0619062b988576fe2d39b33ff23fb1a0330c0ac7",
    Uniswap_UNI_ETH_V3_005: "0xfaa318479b7755b2dbfdd34dc306cb28b420ad12",
    Sushi_UNI_ETH_V2_03: "0xdafd66636e2561b0284edde37e42d192f2844d40",
    BalancerCow_UNI_ETH: "0xa81b22966f1841e383e69393175e2cc65f0a8854",
  },
  [DaoIdEnum.ENS]: {
    Uniswap_ENS_5: "0x92560c178ce069cc014138ed3c2f5221ba71f58a",
    SushiSwapEthENSV2: "0xa1181481beb2dc5de0daf2c85392d81c704bf75d",
  },
  [DaoIdEnum.ARB]: {},
  [DaoIdEnum.NOUNS]: {},
  [DaoIdEnum.OP]: {
    "Velodrome Finance": "0x47029bc8f5cbe3b464004e87ef9c9419a48018cd",
    "Uniswap 1": "0x9a13f98cb987694c9f086b1f5eb990eea8264ec3",
    "Uniswap 2": "0xfc1f3296458f9b2a27a0b91dd7681c4020e09d05",
    "Uniswap 3": "0xa39fe8f7a00ce28b572617d3a0bc1c2b44110e79",
    "WooFi 1": "0x5520385bfcf07ec87c4c53a7d8d65595dff69fa4",
    Curve: "0xd8dd9a8b2aca88e68c46af9008259d0ec04b7751",
    Balancer: "0xba12222222228d8ba445958a75a0704d566bf2c8",
    Mux: "0xc6bd76fa1e9e789345e003b361e4a0037dfb7260",
  },
  [DaoIdEnum.TEST]: {
    // DEX pools - Charlie and David for comprehensive coverage
    Charlie_DEX_Pool: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", // Charlie as DEX
    David_DEX_Pool: "0x90f79bf6eb2c4f870365e785982e1f101e93b906", // David as DEX
    // ENS contract addresses involved in DEX-like operations
    ENSToken: "0x244de6b06e7087110b94cde88a42d9aba17efa52",
    ENSTimelock: "0xa7e99c1df635d13d61f7c81ece571cc952e64526",
  },
  [DaoIdEnum.GTC]: {
    Uniswap: "0xd017617f6f0fd22796e137a8240cc38f52a147b2",
  },
  [DaoIdEnum.SCR]: {
    Honeypop: "0x7761786afab6e496e6bf3ebe56fc2ea71cd02d7d",
    DEX: "0x7761786afab6e496e6bf3ebe56fc2ea71cd02d7d",
    "Ambient Finance": "0xaaaaaaaacb71bf2c8cae522ea5fa455571a74106",
    SyncSwap: "0x7160570bb153edd0ea1775ec2b2ac9b65f1ab61b",
    Nuri: "0x76c662b1e25cb67d7365191b55813d8cd3fdac02",
  },
  [DaoIdEnum.COMP]: {
    Uniswap: "0x5598931bfbb43eec686fa4b5b92b5152ebadc2f6",
    "Uniswap 2": "0xea4ba4ce14fdd287f380b55419b1c5b6c3f22ab6",
    "Pancake Swap": "0x0392957571f28037607c14832d16f8b653edd472",
  },
  [DaoIdEnum.OBOL]: {
    "Uniswap V3 Pool": "0x57f52c9faa6d40c5163d76b8d7dd81ddb7c95434",
    "Uniswap PoolManager": "0x000000000004444c5dc75cb358380d2e3de08a90",
  },
  [DaoIdEnum.ZK]: {
    "Pancake Swap": "0xf92b0178bc932a59d45c1c4aac81712aac6a5b61",
    Uniswap: "0x3d7264539e6e3f596bb485e3091f3ae02ad01ef8",
  },
};

export const LendingAddresses: Record<DaoIdEnum, Record<string, Address>> = {
  [DaoIdEnum.UNI]: {
    AaveEthUni: "0xf6d2224916ddfbbab6e6bd0d1b7034f4ae0cab18",
    MorphoBlue: "0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb",
    CompoundCUNI: "0x35a18000230da775cac24873d00ff85bccded550",
  },
  [DaoIdEnum.ENS]: {
    //After research using intel.arkm and defi llama token-usage page, I only found this lending address so far
    AaveEthENS: "0x545bd6c032efdde65a377a6719def2796c8e0f2e",
  },
  [DaoIdEnum.ARB]: {},
  [DaoIdEnum.NOUNS]: {},
  [DaoIdEnum.OP]: {
    Aave: "0x513c7e3a9c69ca3e22550ef58ac1c0088e918fff",
    Superfluid: "0x1828bff08bd244f7990eddcd9b19cc654b33cdb4",
    Moonwell: "0x9fc345a20541bf8773988515c5950ed69af01847",
    "Silo Finance": "0x8ed1609d796345661d36291b411992e85de7b224",
    "Compound 1": "0x2e44e174f7d53f0212823acc11c01a11d58c5bcb",
    "Compound 2": "0x995e394b8b2437ac8ce61ee0bc610d617962b214",
    "Exactly Protocol": "0xa430a427bd00210506589906a71b54d6c256cedb",
    Morpho: "0xf057afeec22e220f47ad4220871364e9e828b2e9",
    dForce: "0x7702dc73e8f8d9ae95cf50933adbee68e9f1d725",
  },
  [DaoIdEnum.TEST]: {
    // Lending protocols - different addresses for comprehensive flag coverage
    Alice_Lending_Protocol: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", // Alice as lending
    Charlie_Lending_Pool: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", // Charlie as lending
    // ENS contract addresses involved in lending-like operations
    ENSGovernor: "0x7c28fc9709650d49c8d0aed2f6ece6b191f192a9",
    ENSTimelock: "0xa7e99c1df635d13d61f7c81ece571cc952e64526",
  },
  [DaoIdEnum.GTC]: {},
  [DaoIdEnum.SCR]: {
    Aave: "0x25718130c2a8eb94e2e1fafb5f1cdd4b459acf64",
  },
  [DaoIdEnum.COMP]: {
    Compound: "0xc3d688b66703497daa19211eedff47f25384cdc3",
    "Compound 2": "0x3afdc9bca9213a35503b077a6072f3d0d5ab0840",
  },
  [DaoIdEnum.OBOL]: {},
  [DaoIdEnum.ZK]: {
    Aave: "0xd6cd2c0fc55936498726cacc497832052a9b2d1b",
    Venus: "0x697a70779c1a03ba2bd28b7627a902bff831b616",
  },
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
    Dead: "0x000000000000000000000000000000000000dead",
    TokenContract: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    Airdrop: "0x090d4613473dee047c3f2706764f49e0821d256e",
  },
  [DaoIdEnum.ENS]: {
    ZeroAddress: zeroAddress,
    Dead: "0x000000000000000000000000000000000000dead",
    TokenContract: "0xc18360217d8f7ab5e7c516566761ea12ce7f9d72",
  },
  [DaoIdEnum.ARB]: {
    ZeroAddress: zeroAddress,
    Dead: "0x000000000000000000000000000000000000dead",
    TokenContract: "0xb50721bcf8d664c30412cfbc6cf7a15145234ad1",
  },
  [DaoIdEnum.OP]: {
    ZeroAddress: zeroAddress,
    Dead: "0x000000000000000000000000000000000000dead",
    TokenContract: "0x4200000000000000000000000000000000000042",
  },
  [DaoIdEnum.TEST]: {
    ZeroAddress: zeroAddress,
    Dead: "0x000000000000000000000000000000000000dead",
    TokenContract: "0x244de6b06e7087110b94cde88a42d9aba17efa52",
  },
  [DaoIdEnum.GTC]: {
    ZeroAddress: zeroAddress,
    Dead: "0x0000000000000000000000000000000000000000",
    TokenContract: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
  },
  [DaoIdEnum.NOUNS]: {
    ZeroAddress: zeroAddress,
    Dead: "0x0000000000000000000000000000000000000000",
    TokenContract: "0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03",
  },
  [DaoIdEnum.SCR]: {
    ZeroAddress: zeroAddress,
    Dead: "0x0000000000000000000000000000000000000000",
    TokenContract: "0xd29687c813d741e2f938f4ac377128810e217b1b",
  },
  [DaoIdEnum.COMP]: {
    ZeroAddress: zeroAddress,
    Dead: "0x0000000000000000000000000000000000000000",
    TokenContract: "0xc00e94cb662c3520282e6f5717214004a7f26888",
  },
  [DaoIdEnum.OBOL]: {
    ZeroAddress: zeroAddress,
    Dead: "0x0000000000000000000000000000000000000000",
    TokenContract: "0x0b010000b7624eb9b3dfbc279673c76e9d29d5f7",
  },
  [DaoIdEnum.ZK]: {
    ZeroAddress: zeroAddress,
    Dead: "0x0000000000000000000000000000000000000000",
    TokenContract: "0x5a7d6b2f92c77fad6ccabd7ee0624e64907eaf3e",
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
