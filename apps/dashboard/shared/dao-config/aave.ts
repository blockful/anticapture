import { mainnet } from "viem/chains";

import { AaveIcon } from "@/shared/components/icons/AaveIcon";
import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";
import type { DaoConfiguration } from "@/shared/dao-config/types";
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
      token: [
        {
          label: "AAVE",
          address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
        },
        {
          label: "stkAAVE",
          address: "0x4da27a545c0c5B758a6BA100e3a049001de870f5",
        },
        {
          label: "aAAVE",
          address: "0xA700b4eB416Be35b2911fd5Dee80678ff64fF6C9",
        },
      ],
    },
  },
  dataTables: true,
  // TODO: Enable governancePage after implementing AAVE Governance V3 support:
  // 1. Indexer: Add governor contract (0x9AEE0B04504CeF83A65AC3f0e838D0593BCb2BC7) with V3 events
  //    (ProposalCreated, VoteEmitted, ProposalQueued, ProposalExecuted, ProposalCanceled)
  // 2. API Client: Implement AAVEClient with real governor address, ABI, getQuorum(),
  //    getTimelockDelay(), and V3-specific getProposalStatus() override
  // 3. Dashboard: Add governor/timelock contract addresses, rules, and vote handler
  // 4. AAVE V3 uses per-access-level voting configs, not global quorum/delay
  // See: https://github.com/blockful/anticapture/pull/1741 for details
};
