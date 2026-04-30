import { useMemo } from "react";

import { useDaoOverviewData } from "@/features/dao-overview/hooks/useDaoOverviewData";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import {
  formatBlocksToUserReadable,
  formatNumberUserReadable,
  formatSecondsToReadable,
} from "@/shared/utils";

export interface GovernanceParameter {
  label: string;
  value: string;
  description: string;
}

export interface GovernanceContract {
  label: string;
  address: string;
}

export const useGovernanceSettingsData = (daoId: DaoIdEnum) => {
  const daoConfig = daoConfigByDaoId[daoId];
  const {
    proposalThresholdValue,
    proposalThresholdPercentage,
    quorumValueFormatted,
    votingPeriod,
    votingDelay,
    timelockDelay,
    isLoading,
  } = useDaoOverviewData({ daoId, daoConfig });

  const blockTime = daoConfig.daoOverview.chain.blockTime
    ? daoConfig.daoOverview.chain.blockTime / 1000
    : 0;

  const parameters = useMemo((): GovernanceParameter[] => {
    const rules = daoConfig.daoOverview.rules;
    const thresholdPct = proposalThresholdPercentage
      ? `${parseFloat(proposalThresholdPercentage).toFixed(1)}%`
      : "N/A";

    const executionMethod = rules?.timelock
      ? "Timelock"
      : rules?.cancelFunction
        ? "Cancel Function"
        : "N/A";

    const executionDelay =
      executionMethod === "Timelock" && timelockDelay
        ? formatSecondsToReadable(timelockDelay, true)
        : null;

    return [
      {
        label: "Proposal Threshold",
        value: `${proposalThresholdValue} ${daoId} (${thresholdPct} Total Supply)`,
        description: "Minimum voting power to submit",
      },
      {
        label: "Quorum",
        value: `${formatNumberUserReadable(quorumValueFormatted)} ${daoId}`,
        description: `Only ${rules?.logic ?? "N/A"} votes are counted`,
      },
      {
        label: "Voting Period",
        value: `${formatBlocksToUserReadable(votingPeriod, blockTime, true)} to vote`,
        description: `Starts after ${formatBlocksToUserReadable(votingDelay, blockTime, true) || "N/A"} delay`,
      },
      {
        label: "Execution Rules",
        value: `Executed by ${executionMethod}`,
        description: executionDelay
          ? `After ${executionDelay} of delay`
          : "No delay required",
      },
    ];
  }, [
    daoConfig,
    daoId,
    proposalThresholdValue,
    proposalThresholdPercentage,
    quorumValueFormatted,
    votingPeriod,
    votingDelay,
    timelockDelay,
    blockTime,
  ]);

  const contracts = useMemo((): GovernanceContract[] => {
    const { contracts: configContracts } = daoConfig.daoOverview;
    const result: GovernanceContract[] = [];

    if (configContracts.governor) {
      result.push({
        label: "Governor",
        address: configContracts.governor,
      });
    }

    const tokenAddresses = configContracts.token;
    if (typeof tokenAddresses === "string") {
      result.push({ label: "Token", address: tokenAddresses });
    } else if (Array.isArray(tokenAddresses)) {
      tokenAddresses.forEach((t) => {
        result.push({ label: t.label || "Token", address: t.address });
      });
    }

    if (configContracts.timelock) {
      result.push({
        label: "Timelock",
        address: configContracts.timelock,
      });
    }

    return result;
  }, [daoConfig]);

  return { parameters, contracts, isLoading };
};
