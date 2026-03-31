import { mainnet } from "viem/chains";

import { NounsIcon } from "@/shared/components/icons";
import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";
import type { DaoConfiguration } from "@/shared/dao-config/types";
import { NounsOgIcon } from "@/shared/og/dao-og-icons";

export const LIL_NOUNS: DaoConfiguration = {
  name: "Lil Nouns",
  decimals: 0,
  color: {
    svgColor: "#000000",
    svgBgColor: "#FFFFFF",
  },
  icon: NounsIcon,
  ogIcon: NounsOgIcon,
  overviewPage: false,
  initialPage: "governance",
  daoOverview: {
    token: "ERC721",
    chain: { ...mainnet, icon: MainnetIcon },
    contracts: {
      governor: "0x5d2C31ce16924C2a71D317e5BbFd5ce387854039",
      token: "0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B",
      timelock: "0xd5f279ff9EB21c6D40C8f345a66f2751C4eeA1fB",
    },
  },
  governancePage: true,
  dataTables: true,
  activityFeed: true,
  tokenDistribution: true,
};
