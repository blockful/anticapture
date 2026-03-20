import { mainnet } from "viem/chains";

import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import type { DaoConfiguration } from "@/shared/dao-config/types";
import { EnsOgIcon } from "@/shared/og/dao-og-icons";
import { FluidIcon } from "../components/icons/FluidIcon";

export const FLUID: DaoConfiguration = {
  name: "Fluid",
  decimals: 18,
  color: {
    svgColor: "#1A1A2E",
    svgBgColor: "#6C63FF",
  },
  ogIcon: EnsOgIcon,
  icon: FluidIcon,
  daoOverview: {
    token: "ERC20",
    chain: { ...mainnet, icon: MainnetIcon },
    contracts: {
      governor: "0x0204Cd037B2ec03605CFdFe482D8e257C765fA1B",
      token: "0x6f40d4A6237C257fff2dB00FA0510DeEECd303eb",
      timelock: "0xC7Cb1dE2721BFC0E0DA1b9D526bCdC54eF1C0eFC",
    },
    govPlatform: {
      name: "Tally",
      url: "https://tally.xyz/gov/fluid/proposal/",
    },
    rules: {
      delay: true,
      changeVote: false,
      timelock: true,
      cancelFunction: false,
      logic: "For",
      quorumCalculation: QUORUM_CALCULATION_TYPES.TOTAL_SUPPLY,
    },
  },
  initialPage: "governance",
  overviewPage: false,
  tokenDistribution: true,
  dataTables: true,
  activityFeed: false,
  governancePage: true,
};
