import { FeedEventListResponse } from "@/features/activity-feed/types";

// Set to true to use mock data instead of real API
export const USE_MOCK_DATA = false;

export const MOCK_FEED_DATA: FeedEventListResponse = {
  items: [
    // PROPOSALS (high relevance)
    {
      txHash:
        "0x6d20a925956648b91de9316b105a10cb792cbbd221b4eecf1e7905ff95b1612d",
      logIndex: 735,
      timestamp: "1768300835",
      relevance: "high",
      type: "proposal",
      proposal: {
        proposer: "0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5",
        proposalId:
          "14510804444537789574755459676993085422296887570909724875059792580501615462793",
        proposalTitle:
          "# Assign Ownership of the .kred TLD to Verified Multisig Controller",
        votingPower: "148030418706052138580614",
      },
    },
    {
      txHash:
        "0x67820a7383c2fa3cffc32ac8a4bde39a966d72389e5b51f71286cc12a5ad30cb",
      logIndex: 239,
      timestamp: "1765868435",
      relevance: "high",
      type: "proposal",
      proposal: {
        proposer: "0x1D5460F896521aD685Ea4c3F2c679Ec0b6806359",
        proposalId:
          "32193910699583510191805100765941306153785098144960716714178124679398515702376",
        proposalTitle:
          "# [EP 6.27] [Executable] Endowment permissions to karpatkey - Update #7",
        votingPower: "100319214182738587230382",
      },
    },
    {
      txHash:
        "0x4ae0fa535796a65fa519cd0b730239223fede8f9d6cfbadaac1c790012576eb2",
      logIndex: 448,
      timestamp: "1761071879",
      relevance: "high",
      type: "proposal",
      proposal: {
        proposer: "0x1D5460F896521aD685Ea4c3F2c679Ec0b6806359",
        proposalId:
          "12950686153984121876325788121804936905339482144562527684056466889156345680789",
        proposalTitle:
          "# [EP 6.23] [Executable] Endowment permissions to karpatkey - Update #6",
        votingPower: "100319214182738587230382",
      },
    },
    {
      txHash:
        "0xb26bb4ea9834306eb62ff9d3b3cd2bc21f675df9082666b8bd7e8199a7b01579",
      logIndex: 96,
      timestamp: "1761071411",
      relevance: "high",
      type: "proposal",
      proposal: {
        proposer: "0x5BFCB4BE4d7B43437d5A0c57E908c048a4418390",
        proposalId:
          "89533866253315759669817396047764505253840458037760720608881002428435364696940",
        proposalTitle: "# [EP 6.22] [Executable] ENS Contract Naming Season",
        votingPower: "267413067991624597148554",
      },
    },
    {
      txHash:
        "0x8bac09c06ea7b671d7eb7d48a707d29b79fcf4a9c2c19614b5dd9f01dd08317a",
      logIndex: 167,
      timestamp: "1759773395",
      relevance: "high",
      type: "proposal",
      proposal: {
        proposer: "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
        proposalId:
          "108835189906614532703236602621229289879643217303874617456878894788222576090451",
        proposalTitle:
          "# [Executable] Set Primary Names for Core DAO Addresses",
        votingPower: "108498568378491004438894",
      },
    },

    // VOTES (mixed relevance)
    {
      txHash:
        "0x8df81793d875adc1fd1a0791e20815699c28876427ac64404fa3c3cd0075492b",
      logIndex: 197,
      timestamp: "1768720403",
      relevance: "high",
      type: "vote",
      vote: {
        voter: "0x5BFCB4BE4d7B43437d5A0c57E908c048a4418390",
        votingPower: "267414074691624597148554",
        proposalId:
          "14510804444537789574755459676993085422296887570909724875059792580501615462793",
        proposalTitle:
          "# Assign Ownership of the .kred TLD to Verified Multisig Controller",
        support: "for",
      },
    },
    {
      txHash:
        "0xf13c52055e70595863c0f46f4489c02aadae7a96004109659b0b91bbc5bf596a",
      logIndex: 535,
      timestamp: "1768851047",
      relevance: "medium",
      type: "vote",
      vote: {
        voter: "0x8787FC2De4De95c53e5E3a4e5459247D9773ea52",
        votingPower: "60298880000000000000000",
        proposalId:
          "14510804444537789574755459676993085422296887570909724875059792580501615462793",
        proposalTitle:
          "# Assign Ownership of the .kred TLD to Verified Multisig Controller",
        support: "for",
      },
    },
    {
      txHash:
        "0xb0d2fb91e41028cd916c54eca3496e75daa5089be5d9ab0d4575875afb98fcdb",
      logIndex: 255,
      timestamp: "1768824311",
      relevance: "medium",
      type: "vote",
      vote: {
        voter: "0x839395e20bbB182fa440d08F850E6c7A8f6F0780",
        votingPower: "53641762440326028662447",
        proposalId:
          "14510804444537789574755459676993085422296887570909724875059792580501615462793",
        proposalTitle:
          "# Assign Ownership of the .kred TLD to Verified Multisig Controller",
        support: "for",
      },
    },
    {
      txHash:
        "0x1f4b636aa18129b192aacb7566cd49eff0034de7cf72f6ee35a228b841229afa",
      logIndex: 200,
      timestamp: "1768794911",
      relevance: "medium",
      type: "vote",
      vote: {
        voter: "0xc02771315d0958F23a64140160E78ECB9bB8614e",
        votingPower: "50000000000000000000000",
        proposalId:
          "14510804444537789574755459676993085422296887570909724875059792580501615462793",
        proposalTitle:
          "# Assign Ownership of the .kred TLD to Verified Multisig Controller",
        support: "for",
      },
    },
    {
      txHash:
        "0x597c7609de93d6e2d17779934f3cb493e20fbe2538b44d6846717d179e14af00",
      logIndex: 15,
      timestamp: "1768580711",
      relevance: "medium",
      type: "vote",
      vote: {
        voter: "0xB352bB4E2A4f27683435f153A259f1B207218b1b",
        votingPower: "60000000000000000000000",
        proposalId:
          "14510804444537789574755459676993085422296887570909724875059792580501615462793",
        proposalTitle:
          "# Assign Ownership of the .kred TLD to Verified Multisig Controller",
        support: "for",
      },
    },
    {
      txHash:
        "0xac9345ae0bb04353e8392a94d04a1b02ab22bfb75b8c401ba294e8c560af0a03",
      logIndex: 324,
      timestamp: "1768836563",
      relevance: "low",
      type: "vote",
      vote: {
        voter: "0x3335cc8BDa40fB5a5F8Db1D0011dEc98728d81E1",
        votingPower: "4554580261949407993258",
        proposalId:
          "14510804444537789574755459676993085422296887570909724875059792580501615462793",
        proposalTitle:
          "# Assign Ownership of the .kred TLD to Verified Multisig Controller",
        support: "for",
      },
    },
    {
      txHash:
        "0x08648922cf8606c0dc3b09a6aefe3af42c0acfd3e87a841e576e20bf31311fe7",
      logIndex: 333,
      timestamp: "1768815251",
      relevance: "low",
      type: "vote",
      vote: {
        voter: "0x4AA5D5059aEB7d2796Ae887081917160c0Cadf66",
        votingPower: "9303259495561263292525",
        proposalId:
          "14510804444537789574755459676993085422296887570909724875059792580501615462793",
        proposalTitle:
          "# Assign Ownership of the .kred TLD to Verified Multisig Controller",
        support: "for",
      },
    },
    {
      txHash:
        "0x5e76fe45d2543081719de0c70b9ca3cd1d190e0a4e19859d042f3adfcd714bec",
      logIndex: 142,
      timestamp: "1768741427",
      relevance: "low",
      type: "vote",
      vote: {
        voter: "0x2e11E3b40Ca0C4aba93a2Cd7C9046394b8dd7501",
        votingPower: "4400000000000000000000",
        proposalId:
          "14510804444537789574755459676993085422296887570909724875059792580501615462793",
        proposalTitle:
          "# Assign Ownership of the .kred TLD to Verified Multisig Controller",
        support: "for",
      },
    },

    // DELEGATIONS (mixed relevance)
    {
      txHash:
        "0x4a7b9effcca11380b132dc5cbd48d976e19b4d9c658ab9395ccd3b72cddb11f9",
      logIndex: 231,
      timestamp: "1750315511",
      relevance: "medium",
      type: "delegation",
      delegation: {
        delegator: "0xa2407240583E1A7B1Fd0F05262BC885267283eC8",
        delegate: "0x9D097582eF8477c311E4Ab03871d168a7F5Dd88D",
        previousDelegate: "0x0000000000000000000000000000000000000000",
        amount: "47111359502940000000000",
      },
    },
    {
      txHash:
        "0xcf9e29b904d8029d9030097c834551f2d4d3bda99b09b7c46f9b4d19945941e6",
      logIndex: 190,
      timestamp: "1759585583",
      relevance: "medium",
      type: "delegation",
      delegation: {
        delegator: "0xc3872cDc3E8cc25a4d9C283ff7239383990E1b1a",
        delegate: "0x983110309620D911731Ac0932219af06091b6744",
        previousDelegate: "0xE2Cded674643743ec1316858dFD4FD2116932E63",
        amount: "10000000000000000000000",
      },
    },
    {
      txHash:
        "0x3f542ff971b5d9b75b4e1cda60a5068fb22f094edc3a08f57969145a8f468fda",
      logIndex: 289,
      timestamp: "1759188191",
      relevance: "medium",
      type: "delegation",
      delegation: {
        delegator: "0x02089aa5eC0A448A12d63F2a1d424bd9610Da396",
        delegate: "0xe52C39327FF7576bAEc3DBFeF0787bd62dB6d726",
        previousDelegate: "0x1F3D3A7A9c548bE39539b39D7400302753E20591",
        amount: "10000000000000000000000",
      },
    },
    {
      txHash:
        "0xb09f09462bb63adcc06d35adb1a26363aaade11b8d992436fb5b3289e241c829",
      logIndex: 361,
      timestamp: "1759846571",
      relevance: "low",
      type: "delegation",
      delegation: {
        delegator: "0x54BeCc7560a7Be76d72ED76a1f5fee6C5a2A7Ab6",
        delegate: "0x54BeCc7560a7Be76d72ED76a1f5fee6C5a2A7Ab6",
        previousDelegate: "0x54BeCc7560a7Be76d72ED76a1f5fee6C5a2A7Ab6",
        amount: "4494907424282230288475",
      },
    },
    {
      txHash:
        "0x285e813ffa13cb15f7893febaf6930287b6d03931738570fb93da727977129ce",
      logIndex: 418,
      timestamp: "1759193363",
      relevance: "low",
      type: "delegation",
      delegation: {
        delegator: "0xa8CC9BCf39E981e5629731A18e87A7FCaf4D72B3",
        delegate: "0xe52C39327FF7576bAEc3DBFeF0787bd62dB6d726",
        previousDelegate: "0x035eBd096AFa6b98372494C7f08f3402324117D3",
        amount: "6522904143836842675981",
      },
    },
    {
      txHash:
        "0x2bb8acc398f0ccaedaddad65ee236e4e55bdf0c60769676e591ba66f3c166d61",
      logIndex: 348,
      timestamp: "1759188539",
      relevance: "low",
      type: "delegation",
      delegation: {
        delegator: "0x6767A09b76bc449a8B632B5A8c15939fcBF6BBb9",
        delegate: "0xe52C39327FF7576bAEc3DBFeF0787bd62dB6d726",
        previousDelegate: "0x035eBd096AFa6b98372494C7f08f3402324117D3",
        amount: "1914576772523157324019",
      },
    },
    {
      txHash:
        "0x8b0633aac17a93e87e1ea2bed1f9c60dad52f381536578e0a5e346f344def6e2",
      logIndex: 206,
      timestamp: "1756374203",
      relevance: "low",
      type: "delegation",
      delegation: {
        delegator: "0x1A851F718F3091c099574bc9f35D08c2d5a1674F",
        delegate: "0x54BeCc7560a7Be76d72ED76a1f5fee6C5a2A7Ab6",
        previousDelegate: "0x0000000000000000000000000000000000000000",
        amount: "3100000000000000000000",
      },
    },
    {
      txHash:
        "0x70e4aea77de5550db5462268f4943bc301e5b2449ce87f78d33a7dcd6a675563",
      logIndex: 81,
      timestamp: "1754519147",
      relevance: "low",
      type: "delegation",
      delegation: {
        delegator: "0x620d82601F76993ac24FBa2E561E77A054C04E5a",
        delegate: "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
        previousDelegate: "0xB9a0fB254Aea7Bcec79c7bd8052dcd902a5388Ff",
        amount: "2938340000000000000000",
      },
    },

    // TRANSFERS (low relevance)
    {
      txHash:
        "0xa0f0a51396bd107a7c73c7363d0d6a61c3432c422d023ab127d38139ecec9165",
      logIndex: 521,
      timestamp: "1769097743",
      relevance: "low",
      type: "transfer",
      transfer: {
        from: "0x000E20A2eEFA97815F3F5057Fcd8920Acf1Ae0dE",
        to: "0x498697892fd0e5e3a16bd40D7bF2644F33CBbBd4",
        amount: "4000000000000000000000",
      },
    },
    {
      txHash:
        "0x6a24990c8fe57bf42d04bcb8b0d24d93c0b39bdb44c36f836d0d819288ba03ae",
      logIndex: 165,
      timestamp: "1769097179",
      relevance: "low",
      type: "transfer",
      transfer: {
        from: "0xd5F5475502120aD0e3dBAa25ECedFFD19D6569Fa",
        to: "0x28C6c06298d514Db089934071355E5743bf21d60",
        amount: "2380060000000000000000",
      },
    },
    {
      txHash:
        "0xc27666ca7da1d331e8a21f56fe6b33b99e56ac4ce38711f727058aee77a1e9bf",
      logIndex: 12,
      timestamp: "1769098931",
      relevance: "low",
      type: "transfer",
      transfer: {
        from: "0x6D7F81Fd14dCA44fE0FE97Ba80fB0Ef5CfC0e9f8",
        to: "0x0D0707963952f2fBA59dD06f2b425ace40b492Fe",
        amount: "1670075000000000000000",
      },
    },
    {
      txHash:
        "0x198c9137bf62c1b0f60c6d5ab893fd30b90bcbf05d60416d3016f78236c6216b",
      logIndex: 176,
      timestamp: "1769097839",
      relevance: "low",
      type: "transfer",
      transfer: {
        from: "0xeB61e99629B891a3cb4BBfa655EfBD714DE7f855",
        to: "0x187c9fBF5bd0f266883c03f320260C407c7B4100",
        amount: "1690041000000000000000",
      },
    },
    {
      txHash:
        "0x213725a94166197ac2dbf884c702383dfd79da31ecc97d278446637824a177fe",
      logIndex: 880,
      timestamp: "1769096675",
      relevance: "low",
      type: "transfer",
      transfer: {
        from: "0x300226F054150e787a797F1fD07f0e38a4A655F4",
        to: "0x28C6c06298d514Db089934071355E5743bf21d60",
        amount: "2000000000000000000000",
      },
    },
    {
      txHash:
        "0xaac649aef9c1f526f2564b9ea758ded056de730f50652472ad7820257f5faf39",
      logIndex: 308,
      timestamp: "1769096423",
      relevance: "low",
      type: "transfer",
      transfer: {
        from: "0x82D1251647Ed918f1fb79CC328517AA87dAd301f",
        to: "0x300226F054150e787a797F1fD07f0e38a4A655F4",
        amount: "2000000000000000000000",
      },
    },
    {
      txHash:
        "0x116fb19352917c3887cdb2c5de1707ead4645b997a4d0bc091da13a0d8ba3dc0",
      logIndex: 314,
      timestamp: "1769096963",
      relevance: "low",
      type: "transfer",
      transfer: {
        from: "0x91D40E4818F4D4C57b4578d9ECa6AFc92aC8DEbE",
        to: "0x6D7F81Fd14dCA44fE0FE97Ba80fB0Ef5CfC0e9f8",
        amount: "1670075000000000000000",
      },
    },
    {
      txHash:
        "0xf6cc5ab40d9345e6ba8845c6dd97d9090929f1ea0e6e173a6252ae11e6a73142",
      logIndex: 805,
      timestamp: "1769096747",
      relevance: "low",
      type: "transfer",
      transfer: {
        from: "0xC9C24d98e1c1eD5c1361E5E999D2fB295637EF96",
        to: "0x91D40E4818F4D4C57b4578d9ECa6AFc92aC8DEbE",
        amount: "1680070000000000000000",
      },
    },
    {
      txHash:
        "0xfd43fc1b103cd142a7b79b03a159e5da91e3ae49b988a15ebe8eabb716646674",
      logIndex: 712,
      timestamp: "1769095679",
      relevance: "low",
      type: "transfer",
      transfer: {
        from: "0x6D9ef51CF48F5aFfd5531BD471B61ae4860C59bE",
        to: "0x000E20A2eEFA97815F3F5057Fcd8920Acf1Ae0dE",
        amount: "2000000000000000000000",
      },
    },
    {
      txHash:
        "0xb53e1bd1baa6c3aa2f2d6805383e1ba1ba16e2c477fa4e8a3776276d7cbb92c4",
      logIndex: 1046,
      timestamp: "1769095751",
      relevance: "low",
      type: "transfer",
      transfer: {
        from: "0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43",
        to: "0xeB61e99629B891a3cb4BBfa655EfBD714DE7f855",
        amount: "1690041000000000000000",
      },
    },
  ],
  totalCount: 100,
};
