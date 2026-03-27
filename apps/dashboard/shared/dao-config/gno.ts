import { mainnet } from "viem/chains";

import { EnsIcon } from "@/shared/components/icons";
import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";
import type { DaoConfiguration } from "@/shared/dao-config/types";
import { EnsOgIcon } from "@/shared/og/dao-og-icons";

export const GNO: DaoConfiguration = {
  name: "GNO",
  decimals: 18,
  color: {
    svgColor: "#0080bc",
    svgBgColor: "#fff",
  },
  icon: EnsIcon,
  ogIcon: EnsOgIcon,
  daoOverview: {
    token: "ERC20",
    chain: { ...mainnet, icon: MainnetIcon, blockTime: 12 },
    // https://etherscan.io/address/0x6810e776880C02933D47DB1b9fc05908e5386b96
    contracts: {
      token: "0x6810e776880C02933D47DB1b9fc05908e5386b96",
    },
    snapshot: "https://snapshot.org/#/gnosis.eth",
    govPlatform: {
      name: "Snapshot",
      url: "https://snapshot.org/#/gnosis.eth",
    },
  },
  dataTables: true,
  governancePage: true,
  activityFeed: true,
  overviewPage: false,
  initialPage: "holders-and-delegates",
  offchainProposals: true,
};
