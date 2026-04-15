import { COMP } from "@/shared/dao-config/comp";
import { ENS } from "@/shared/dao-config/ens";
import { FLUID } from "@/shared/dao-config/fluid";
import { GTC } from "@/shared/dao-config/gtc";
import { LIL_NOUNS } from "@/shared/dao-config/lil-nouns";
import { NOUNS } from "@/shared/dao-config/nouns";
import { OBOL } from "@/shared/dao-config/obol";
import { OP } from "@/shared/dao-config/op";
import { SCR } from "@/shared/dao-config/scr";
import { SHU } from "@/shared/dao-config/shu";
import type { DaoConfiguration } from "@/shared/dao-config/types";
import { UNI } from "@/shared/dao-config/uni";
import { AAVE } from "@/shared/dao-config/aave";
import type { DaoIdEnum } from "@/shared/types/daos";
import { GovernanceImplementationEnum } from "@/shared/types/enums";

const createDerivedGovernanceParameters = (config: DaoConfiguration) => {
  const rules = config.daoOverview.rules;
  const governanceFields = config.governanceImplementation?.fields;

  return [
    {
      label: "Proposal threshold",
      value:
        governanceFields?.[GovernanceImplementationEnum.PROPOSAL_THRESHOLD]
          ?.currentSetting ??
        rules?.proposalThreshold ??
        "Not available",
      description:
        "Minimum voting power required to create an executable proposal.",
    },
    {
      label: "Voting delay",
      value:
        governanceFields?.[GovernanceImplementationEnum.VOTING_DELAY]
          ?.currentSetting ?? "Not available",
      description: "Time between proposal creation and the opening of voting.",
    },
    {
      label: "Voting period",
      value:
        governanceFields?.[GovernanceImplementationEnum.VOTING_PERIOD]
          ?.currentSetting ?? "Not available",
      description: "How long tokenholders can vote on a proposal.",
    },
    {
      label: "Quorum",
      value: rules?.quorumCalculation ?? "Not available",
      description: "How the DAO decides whether enough voting power showed up.",
    },
  ];
};

const withDerivedWhitelabelConfig = (
  config: DaoConfiguration,
): DaoConfiguration => ({
  ...config,
  whitelabel: config.whitelabel
    ? {
        ...config.whitelabel,
        governanceParameters:
          config.whitelabel.governanceParameters ??
          createDerivedGovernanceParameters(config),
      }
    : undefined,
});

const rawDaoConfigByDaoId = {
  AAVE,
  UNI,
  ENS,
  FLUID,
  LIL_NOUNS,
  OP,
  GTC,
  SCR,
  NOUNS,
  COMP,
  OBOL,
  SHU,
} as const;

const daoConfigByDaoId = Object.fromEntries(
  Object.entries(rawDaoConfigByDaoId).map(([daoId, config]) => [
    daoId,
    withDerivedWhitelabelConfig(config),
  ]),
) as Record<DaoIdEnum, DaoConfiguration>;

export default daoConfigByDaoId;
