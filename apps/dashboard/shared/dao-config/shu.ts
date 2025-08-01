import { DaoConfiguration } from "@/shared/dao-config/types";
import {
  RiskLevel,
  SupportStageEnum,
  GovernanceImplementationEnum,
} from "@/shared/types/enums";
import { calculateMonthsBefore } from "@/shared/utils";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { EnsIcon } from "@/shared/components/icons";
import { mainnet } from "viem/chains";

export const SHU: DaoConfiguration = {
  name: "Ethereum Name Service",
  supportStage: SupportStageEnum.FULL,
  icon: EnsIcon,
  daoOverview: {
    chain: mainnet,
    contracts: {
      governor: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
      token: "0x0000000000000000000000000000000000000000",
      timelock: "0x0000000000000000000000000000000000000000",
    },
    rules: {
      logic: "All Votes Cast",
      quorumCalculation: "Total Supply",
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  dataTables: true,
};
