import { FeedEventListResponse } from "@/features/activity-feed/types";

// Set to true to use mock data instead of real API
export const USE_MOCK_DATA = true;

export const MOCK_FEED_DATA: FeedEventListResponse = {
  items: [
    {
      txHash:
        "0x3e32f03562e69da40d7d171de7eb7c43598820186da9ff878bf87a79ba290a25",
      logIndex: 211,
      timestamp: "1769020871",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0xe00F35b704212A0B034DF497Cf5A4AA3B05D3941",
        to: "0x3505Fa9611a661f63cBA79d3c84B54F9c3b383d1",
        amount: "10000000000000000000",
      },
    },
    {
      txHash:
        "0xc3293d384c57a54d7f362719b861decd0b8fe8da30f77dcb24609636df0b82bd",
      logIndex: 464,
      timestamp: "1769020811",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0xDFd5293D8e347dFe59E90eFd55b2956a1343963d",
        to: "0xe129188380d48Fa09A6a89AC91adc761afDc1612",
        amount: "655020693700000000000",
      },
    },
    {
      txHash:
        "0x47a5df9de77f883b2142079ff5c9685df157b67cc7018253466c80fd3033baa6",
      logIndex: 594,
      timestamp: "1769020475",
      relevance: "low",
      type: "transfer",
      transfer: {
        from: "0x5bdf85216ec1e38D6458C870992A69e38e03F7Ef",
        to: "0x086819CB480cEd0Caf4799Dc791210bE946002eb",
        amount: "4900552588260000000000",
      },
    },
    {
      txHash:
        "0xdacc56fae889396b0b277a77e0b7358f67838a575aa8815d53e9b9ae85e0621d",
      logIndex: 366,
      timestamp: "1769020283",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0xa0f9457AA7956482dF7991760F4364d4469B81eE",
        to: "0xce375e718C22B2845C1184cB633A50b7Ee7F7876",
        amount: "266064582148948300",
      },
    },
    {
      txHash:
        "0x81f3540e047654d543dc9023990600e3b2277c39726a2a6b4b6d43592c682ef9",
      logIndex: 40,
      timestamp: "1769020271",
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
      timestamp: "1769020127",
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
      timestamp: "1769020007",
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
      timestamp: "1769019911",
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
      timestamp: "1769019743",
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
      timestamp: "1769019299",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0xE95b0243a5C5E6fA4B8f34CB525A64E6A1b9aEC9",
        to: "0xB51Bf9029d778899d42e96ebCdc0498bd061006d",
        amount: "213114792470000000000",
      },
    },
    {
      txHash:
        "0x16a703eaf8981545fcae3200d2ce331b1b13ee5f6c3845c6adbe5a325ad8550c",
      logIndex: 316,
      timestamp: "1769019215",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0x09Aa63b7a22eEfC372196AaCd5b53441eD390BFb",
        to: "0xfBd4cdB413E45a52E2C8312f670e9cE67E794C37",
        amount: "19158000229705177242",
      },
    },
    {
      txHash:
        "0x1daf94fa505a416c7add36741540b594c8bf4cf181af16365ccedc12e1cb43c4",
      logIndex: 586,
      timestamp: "1769019191",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0x09Aa63b7a22eEfC372196AaCd5b53441eD390BFb",
        to: "0xfBd4cdB413E45a52E2C8312f670e9cE67E794C37",
        amount: "29568420922736483051",
      },
    },
    {
      txHash:
        "0xedfc2b390a980bd073abde409696777bcc1949d105ffcdb5511d20039ecfae34",
      logIndex: 500,
      timestamp: "1769019179",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0xa0f9457AA7956482dF7991760F4364d4469B81eE",
        to: "0xa0f9457AA7956482dF7991760F4364d4469B81eE",
        amount: "266645242165242160",
      },
    },
    {
      txHash:
        "0xa2ea0685a52d005b26b332134a626dee38b3f77b8c633eff8bdcee39a25d567e",
      logIndex: 197,
      timestamp: "1769019119",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0x9430b3295f47deD6E6a090dc266F3a2727f599d0",
        to: "0x187c9fBF5bd0f266883c03f320260C407c7B4100",
        amount: "7293931510000000000",
      },
    },
    {
      txHash:
        "0x27b41876f19cb5e0ecb6c1760688d181373101e5f621345f71c270aae94d2f16",
      logIndex: 312,
      timestamp: "1769019011",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0xBEE3211ab312a8D065c4FeF0247448e17A8da000",
        to: "0xa75c93E895DC2Fb3B034bf4AC59cf85c4C99aE1f",
        amount: "14878309102673198000",
      },
    },
    {
      txHash:
        "0xdc287fe734b15433ff9e4be2f332183854e5847536acb6913619289c13c192a9",
      logIndex: 50,
      timestamp: "1769018747",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0x1C727a55eA3c11B0ab7D3a361Fe0F3C47cE6de5d",
        to: "0x373cCC31D651b6B826A6aEC08D000f2D2394B3E0",
        amount: "168469029885910825832",
      },
    },
    {
      txHash:
        "0xca04f4c10ab3f684a3bc26f2e34eaeef423de1ec595272d4c3dedc24e71aa6f3",
      logIndex: 994,
      timestamp: "1769018291",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0x09Aa63b7a22eEfC372196AaCd5b53441eD390BFb",
        to: "0xfBd4cdB413E45a52E2C8312f670e9cE67E794C37",
        amount: "21551583441342344388",
      },
    },
    {
      txHash:
        "0xbaba18aa2c5ba8de3d37b4ce9f0060a60f654b415f5aa31a53030681e2e55a70",
      logIndex: 366,
      timestamp: "1769017979",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0x797D5c8130bf943b658FD5352bBa49D92C0d38B4",
        to: "0x28C6c06298d514Db089934071355E5743bf21d60",
        amount: "362096285500000000000",
      },
    },
    {
      txHash:
        "0xf2db5ddbd3b77a5bf5a27efb20fabb7cdee2020168e9bbc2aa1ea0e5223adc61",
      logIndex: 671,
      timestamp: "1769017871",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0x7ECAD83c191D09ee764CC6D7E1580A102445f6d0",
        to: "0x371380F3Bd8Bd28ef237BE7F4EDE1c4C9462fe96",
        amount: "229000000000000000000",
      },
    },
    {
      txHash:
        "0x4b43ea84d2daab0241af92f77cba7824589d34ea01a982bef5fb9a8d440400ab",
      logIndex: 644,
      timestamp: "1769017751",
      relevance: "none",
      type: "transfer",
      transfer: {
        from: "0xfBd4cdB413E45a52E2C8312f670e9cE67E794C37",
        to: "0xa1181481bEb2dc5De0DaF2c85392d81C704BF75D",
        amount: "14566304007895188592",
      },
    },
  ],
  totalCount: 1587714,
};
