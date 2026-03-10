import { mainnet } from "viem/chains";

import { AaveIcon } from "@/shared/components/icons/AaveIcon";
import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { UniswapOgIcon } from "@/shared/og/dao-og-icons";

export const AAVE: DaoConfiguration = {
  name: "AAVE",
  decimals: 18,
  color: {
    svgColor: "#27272A",
    svgBgColor: "#9391F7",
  },
  icon: AaveIcon,
  ogIcon: UniswapOgIcon,
  daoOverview: {
    token: "ERC20",
    chain: { ...mainnet, icon: MainnetIcon },
    contracts: {
      token: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    },
  },
  dataTables: true,
};
