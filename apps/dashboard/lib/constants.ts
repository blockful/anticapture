export const SECTIONS_CONSTANTS = {
  dashboard: {
    title: "Dashboard",
    description: undefined,
    anchorId: "dashboardSection",
  },
  daoInfo: {
    title: "DAO Information",
    description: undefined,
    anchorId: "daoInfoSection",
  },
  attackProfitability: {
    title: "Attack Profitability",
    description:
      "Takes into account the maximum cost and the minimum profit possible. If it looks bad, it’s bad. If it looks good, it’s better, but it does not represent 100% safety. Remember that both getting votes and causing damage can take other formats beyond direct buying and selling assets.",
    anchorId: "attackProfitabilitySection",
  },
  governanceActivity: {
    title: "Governance Activity",
    description:
      "Governance activity metrics are based on a 30 days average. Choosing the time frame buttons above will give you the variation based on the 30 days average prior to that date compared to the current",
    anchorId: "governanceActivitySection",
  },
  tokenDistribution: {
    title: "Token Distribution",
    description:
      "Token distribution metrics are based on Blockful's Governance Indexer and are updated after a new block is confirmed with new interaction with relevant contracts.",
    anchorId: "tokenDistributionSection",
  },
  governanceImplementation: {
    title: "Governance Implementation",
    description: undefined,
    anchorId: "governanceImplementationSection",
  },
  showSupport: {
    title: "Support Potential DAOs",
    description: "",
    anchorId: "showSupportSection", 
  },
};
