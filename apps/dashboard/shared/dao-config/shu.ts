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
  name: "Shutter",
  supportStage: SupportStageEnum.FULL,
  icon: ShutterIcon,
  daoOverview: {
    chain: mainnet,
    contracts: {
      governor: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
      token: "0xe485E2f1bab389C08721B291f6b59780feC83Fd7",
      timelock: "0x36bD3044ab68f600f6d3e081056F34f2a58432c4",
    },
    rules: {
      logic: "All Votes Cast",
      quorumCalculation: "Total Supply",
    },
  },
  resilienceStages: false,
  tokenDistribution: false,
  dataTables: true,
};
