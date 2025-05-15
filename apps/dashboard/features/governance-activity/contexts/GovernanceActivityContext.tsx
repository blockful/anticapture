"use client";

import { createContext, useContext, useState } from "react";
import { TimeInterval } from "@/shared/types/enums/time-related";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  MetricData,
  GovernanceActivityContextProps,
} from "@/shared/contexts/types";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import {
  useActiveSupply,
  useAverageTurnout,
  useTimeSeriesData,
  useProposals,
  useVotes,
} from "@/shared/hooks";
import { formatUnits } from "viem";

const initialMetricData = {
  value: undefined,
  changeRate: undefined,
};

export const GovernanceActivityContext =
  createContext<GovernanceActivityContextProps>({
    days: TimeInterval.NINETY_DAYS,
    setDays: () => {},
    treasury: initialMetricData,
    setTreasury: () => {},
    treasurySupplyChart: [],
    setTreasurySupplyChart: () => {},
    proposals: initialMetricData,
    activeSupply: initialMetricData,
    votes: initialMetricData,
    averageTurnout: initialMetricData,
  });

export const GovernanceActivityProvider = ({
  children,
  daoId,
}: {
  children: React.ReactNode;
  daoId: DaoIdEnum;
}) => {
  const [days, setDays] = useState<TimeInterval>(TimeInterval.NINETY_DAYS);
  const [treasury, setTreasury] = useState<MetricData>(initialMetricData);
  const [treasurySupplyChart, setTreasurySupplyChart] = useState<
    DaoMetricsDayBucket[]
  >([]);

  const { data: treasuryData } = useTimeSeriesData(
    daoId,
    [MetricTypesEnum.TREASURY],
    days,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
    },
  );

  const { data: activeSupplyData } = useActiveSupply(daoId, days, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
  });

  const { data: proposalsData } = useProposals(daoId, days, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
  });

  const { data: votesData } = useVotes(daoId, days, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
  });

  const { data: averageTurnoutData } = useAverageTurnout(daoId, days, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
  });

  if (treasuryData && treasuryData[MetricTypesEnum.TREASURY]) {
    const data = treasuryData[MetricTypesEnum.TREASURY];
    if (data.length > 0 && treasury.value === undefined) {
      const currentHigh = data[data.length - 1]?.high ?? "0";
      const oldHigh = data[0]?.high ?? "0";
      let changeRate = "0";

      if (currentHigh !== "0" && oldHigh !== "0") {
        try {
          changeRate = formatUnits(
            (BigInt(currentHigh) * BigInt(1e18)) / BigInt(oldHigh) -
              BigInt(1e18),
            18,
          );
        } catch (e) {
          console.error(e);
        }
      }

      setTreasury({
        value: String(BigInt(currentHigh || "0") / BigInt(10 ** 18)),
        changeRate,
      });
      setTreasurySupplyChart(data);
    }
  }

  return (
    <GovernanceActivityContext.Provider
      value={{
        days,
        setDays,
        treasury,
        setTreasury,
        treasurySupplyChart,
        setTreasurySupplyChart,
        proposals: {
          value: proposalsData?.currentProposalsLaunched
            ? String(proposalsData?.currentProposalsLaunched)
            : undefined,
          changeRate: proposalsData?.changeRate,
        },
        activeSupply: {
          value: activeSupplyData?.activeSupply,
          changeRate: undefined,
        },
        votes: {
          value: votesData?.currentVotes,
          changeRate: votesData?.changeRate,
        },
        averageTurnout: {
          value: averageTurnoutData
            ? String(
                BigInt(averageTurnoutData?.currentAverageTurnout ?? "0") /
                  BigInt(10 ** 18),
              )
            : undefined,
          changeRate: averageTurnoutData?.changeRate,
        },
      }}
    >
      {children}
    </GovernanceActivityContext.Provider>
  );
};

export const useGovernanceActivityContext = () =>
  useContext(GovernanceActivityContext);
