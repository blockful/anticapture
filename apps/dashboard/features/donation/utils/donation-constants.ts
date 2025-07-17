export const DONATION_CONSTANTS = {
  donation: {
    title: "Your donation helps make the Ethereum ecosystem safer.",
    description:
      "We're building a platform to strengthen DAO governance security—helping protocols spot risks early, increase the cost of capture, and stop attacks before they happen.",
    address: "0x3c37e9187baea29e6a75abec0ad5a070693d4502",
    ensAddress: "donate.blockful.eth",
    qrCodeUrl: "/donation-qr-code.svg", // This would be a generated QR code
    supportedChains: ["Ethereum", "Arbitrum", "Optimism", "Scroll", "ZKsync"],
    chainLinks: {
      Ethereum:
        "https://etherscan.io/address/0x3c37e9187baea29e6a75abec0ad5a070693d4502",
      Arbitrum:
        "https://arbiscan.io/address/0x3c37e9187baea29e6a75abec0ad5a070693d4502",
      Optimism:
        "https://optimistic.etherscan.io/address/0x3c37e9187baea29e6a75abec0ad5a070693d4502",
      Scroll:
        "https://scrollscan.com/address/0x3c37e9187baea29e6a75abec0ad5a070693d4502",
      ZKsync:
        "https://explorer.zksync.io/address/0x3c37e9187baea29e6a75abec0ad5a070693d4502",
    },
    benefits: [
      "Make DAO security visible, measurable, and accountable.",
      "Improve Ethereum's legibility—without compromising credible neutrality.",
      "Push DAOs and the ecosystem to take action.",
    ],
  },
  fundingSources: [
    {
      name: "ENS Foundation",
      amount: "$100k+",
      date: "October, 2024",
      logo: "/logo/ENS.png",
      link: "https://discuss.ens.domains/t/ep-5-23-executable-governance-security-bounty/19803",
    },
    {
      name: "Uniswap Foundation",
      amount: "$100k+",
      date: "December, 2024",
      logo: "/logo/UNI.png",
      link: "https://uniswapfoundation.mirror.xyz/SAPBIdMcJpo_gUUyHdMNuH8r7qpCqRtxFbDrui7Na-I",
    },
    {
      name: "Optimism",
      amount: "$15k+",
      date: "June, 2024",
      logo: "/logo/Optimism.png",
      link: "https://app.charmverse.io/op-grants/governance-audit-and-dashboard-by-blockful-22656444457292424",
    },
  ],
};
