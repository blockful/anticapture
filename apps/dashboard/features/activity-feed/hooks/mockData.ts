import { FeedEventListResponse } from "@/features/activity-feed/types";

// Set to true to use mock data instead of real API
export const USE_MOCK_DATA = false;

// Current timestamp for "today" events
const now = Math.floor(Date.now() / 1000);
const oneHourAgo = now - 3600;
const twoHoursAgo = now - 7200;
const threeHoursAgo = now - 10800;
const yesterday = now - 86400;
const twoDaysAgo = now - 172800;

export const MOCK_FEED_DATA: FeedEventListResponse = {
  items: [
    // HIGH RELEVANCE - Proposal created (always high)
    {
      txHash:
        "0xabc123proposal0000000000000000000000000000000000000000000000001",
      logIndex: 0,
      timestamp: String(oneHourAgo),
      relevance: "high",
      type: "proposal",
      proposal: {
        proposer: "0x5A384227B65FA093DEC03Ec34e111Db80A040615",
        proposalId: "42",
        proposalTitle:
          "[EP5.2] Activate new .eth Registrar Controller and Reverse Registrar",
        votingPower: "250000000000000000000000",
      },
    },
    // HIGH RELEVANCE - Large vote
    {
      txHash:
        "0xdef456vote000000000000000000000000000000000000000000000000000001",
      logIndex: 1,
      timestamp: String(twoHoursAgo),
      relevance: "high",
      type: "vote",
      vote: {
        voter: "0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5",
        votingPower: "1500000000000000000000000",
        proposalId: "41",
        proposalTitle: "[EP5.1] Fund the ENS Labs 2025 Budget",
        support: "for",
      },
    },
    // HIGH RELEVANCE - Large delegation
    {
      txHash:
        "0x789delegation00000000000000000000000000000000000000000000000001",
      logIndex: 2,
      timestamp: String(threeHoursAgo),
      relevance: "high",
      type: "delegation",
      delegation: {
        delegator: "0x225f137127d9067788314bc7fcc1f36746a3c3B5",
        delegate: "0x5A384227B65FA093DEC03Ec34e111Db80A040615",
        previousDelegate: "0x0000000000000000000000000000000000000000",
        amount: "800000000000000000000000",
      },
    },
    // HIGH RELEVANCE - Large transfer
    {
      txHash:
        "0x47a5df9de77f883b2142079ff5c9685df157b67cc7018253466c80fd3033baa6",
      logIndex: 594,
      timestamp: String(yesterday),
      relevance: "high",
      type: "transfer",
      transfer: {
        from: "0x5bdf85216ec1e38D6458C870992A69e38e03F7Ef",
        to: "0x086819CB480cEd0Caf4799Dc791210bE946002eb",
        amount: "4900552588260000000000000",
      },
    },
    // MEDIUM RELEVANCE - Vote against
    {
      txHash:
        "0xdef456vote000000000000000000000000000000000000000000000000000002",
      logIndex: 3,
      timestamp: String(yesterday - 1000),
      relevance: "medium",
      type: "vote",
      vote: {
        voter: "0x839395e20bbB182fa440d08F850E6c7A8f6F0780",
        votingPower: "350000000000000000000000",
        proposalId: "41",
        proposalTitle: "[EP5.1] Fund the ENS Labs 2025 Budget",
        support: "against",
      },
    },
    // MEDIUM RELEVANCE - Delegation change
    {
      txHash:
        "0x789delegation00000000000000000000000000000000000000000000000002",
      logIndex: 4,
      timestamp: String(yesterday - 2000),
      relevance: "medium",
      type: "delegation",
      delegation: {
        delegator: "0x3f9Ad3801C0Cf4a3c9Bf105e86EC7Ee778b844c1",
        delegate: "0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5",
        previousDelegate: "0x5A384227B65FA093DEC03Ec34e111Db80A040615",
        amount: "150000000000000000000000",
      },
    },
    // MEDIUM RELEVANCE - Transfer
    {
      txHash:
        "0xc3293d384c57a54d7f362719b861decd0b8fe8da30f77dcb24609636df0b82bd",
      logIndex: 464,
      timestamp: String(yesterday - 3000),
      relevance: "medium",
      type: "transfer",
      transfer: {
        from: "0xDFd5293D8e347dFe59E90eFd55b2956a1343963d",
        to: "0xe129188380d48Fa09A6a89AC91adc761afDc1612",
        amount: "655020693700000000000000",
      },
    },
    // LOW RELEVANCE - Abstain vote
    {
      txHash:
        "0xdef456vote000000000000000000000000000000000000000000000000000003",
      logIndex: 5,
      timestamp: String(twoDaysAgo),
      relevance: "low",
      type: "vote",
      vote: {
        voter: "0x476722357f8EC3E164eCce348BaF2481584836Ea",
        votingPower: "50000000000000000000000",
        proposalId: "40",
        proposalTitle: "[EP4.9] Enable CCIP-Read for ENS Resolver",
        support: "abstain",
      },
    },
    // LOW RELEVANCE - Small delegation
    {
      txHash:
        "0x789delegation00000000000000000000000000000000000000000000000003",
      logIndex: 6,
      timestamp: String(twoDaysAgo - 1000),
      relevance: "low",
      type: "delegation",
      delegation: {
        delegator: "0x1C727a55eA3c11B0ab7D3a361Fe0F3C47cE6de5d",
        delegate: "0x839395e20bbB182fa440d08F850E6c7A8f6F0780",
        previousDelegate: null,
        amount: "5000000000000000000000",
      },
    },
    // LOW RELEVANCE - Transfer
    {
      txHash:
        "0x3e32f03562e69da40d7d171de7eb7c43598820186da9ff878bf87a79ba290a25",
      logIndex: 211,
      timestamp: String(twoDaysAgo - 2000),
      relevance: "low",
      type: "transfer",
      transfer: {
        from: "0xe00F35b704212A0B034DF497Cf5A4AA3B05D3941",
        to: "0x3505Fa9611a661f63cBA79d3c84B54F9c3b383d1",
        amount: "10000000000000000000000",
      },
    },
    // NONE RELEVANCE - Small vote
    {
      txHash:
        "0xdef456vote000000000000000000000000000000000000000000000000000004",
      logIndex: 7,
      timestamp: String(twoDaysAgo - 3000),
      relevance: "none",
      type: "vote",
      vote: {
        voter: "0xa0f9457AA7956482dF7991760F4364d4469B81eE",
        votingPower: "1000000000000000000000",
        proposalId: "40",
        proposalTitle: "[EP4.9] Enable CCIP-Read for ENS Resolver",
        support: "for",
      },
    },
    // NONE RELEVANCE - Tiny delegation
    {
      txHash:
        "0x789delegation00000000000000000000000000000000000000000000000004",
      logIndex: 8,
      timestamp: String(twoDaysAgo - 4000),
      relevance: "none",
      type: "delegation",
      delegation: {
        delegator: "0xBEE3211ab312a8D065c4FeF0247448e17A8da000",
        delegate: "0xa75c93E895DC2Fb3B034bf4AC59cf85c4C99aE1f",
        previousDelegate: "0x476722357f8EC3E164eCce348BaF2481584836Ea",
        amount: "100000000000000000000",
      },
    },
    // NONE RELEVANCE - Small transfer
    {
      txHash:
        "0xdacc56fae889396b0b277a77e0b7358f67838a575aa8815d53e9b9ae85e0621d",
      logIndex: 366,
      timestamp: String(twoDaysAgo - 5000),
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0xa0f9457AA7956482dF7991760F4364d4469B81eE",
        to: "0xce375e718C22B2845C1184cB633A50b7Ee7F7876",
        amount: "266064582148948300",
      },
    },
    // Additional transfers for pagination testing
    {
      txHash:
        "0x81f3540e047654d543dc9023990600e3b2277c39726a2a6b4b6d43592c682ef9",
      logIndex: 40,
      timestamp: String(twoDaysAgo - 6000),
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0x3f9Ad3801C0Cf4a3c9Bf105e86EC7Ee778b844c1",
        to: "0xB647a111936acB0b797944D76756F27f4C02B14D",
        amount: "9932500000000000000",
      },
    },
    {
      txHash:
        "0x325afb84b11558e4453b3dff111f4dd91f84189013486a28df31a9fc062bb1ab",
      logIndex: 914,
      timestamp: String(twoDaysAgo - 7000),
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0xfBd4cdB413E45a52E2C8312f670e9cE67E794C37",
        to: "0x09Aa63b7a22eEfC372196AaCd5b53441eD390BFb",
        amount: "12572715017849331161",
      },
    },
    {
      txHash:
        "0xddf8c4b0f4d7901622962df646281e60d57c5d36d66bd85d168dc34ba06dfa5d",
      logIndex: 346,
      timestamp: String(twoDaysAgo - 8000),
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0xb7cDd9BF31191E5Aea06ca92fCb37A50f07Ae30D",
        to: "0x0e108b436e5f6b1c3D3A30501683cAb80efcf20f",
        amount: "340293017658773471232",
      },
    },
    {
      txHash:
        "0x36dec99ab018d5172c5ba5bdc4f7dbefc0299c3c83cd39f83746c5c7540d0841",
      logIndex: 458,
      timestamp: String(twoDaysAgo - 9000),
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0xBEE3211ab312a8D065c4FeF0247448e17A8da000",
        to: "0xa75c93E895DC2Fb3B034bf4AC59cf85c4C99aE1f",
        amount: "11192281320686206000",
      },
    },
    {
      txHash:
        "0x8212bb935f9b735f7fc4b351820f9e5a3e1f568d0fece8539cdf37ddb131259a",
      logIndex: 183,
      timestamp: String(twoDaysAgo - 10000),
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0x476722357f8EC3E164eCce348BaF2481584836Ea",
        to: "0x3f9Ad3801C0Cf4a3c9Bf105e86EC7Ee778b844c1",
        amount: "9932500000000000000",
      },
    },
    {
      txHash:
        "0x415c020943ee7edc1c205d7c4ce2dc824e8c04d1a542f61f2e7a44692e48733b",
      logIndex: 516,
      timestamp: String(twoDaysAgo - 11000),
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0xE95b0243a5C5E6fA4B8f34CB525A64E6A1b9aEC9",
        to: "0xB51Bf9029d778899d42e96ebCdc0498bd061006d",
        amount: "213114792470000000000",
      },
    },
  ],
  totalCount: 100,
};
