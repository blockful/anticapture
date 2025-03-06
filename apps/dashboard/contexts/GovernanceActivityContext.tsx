/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { TimeInterval } from "@/lib/enums/TimeInterval";
import { DaoMetricsDayBucket } from "@/lib/dao-constants/types";
import { DaoIdEnum } from "@/lib/types/daos";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MetricData, GovernanceActivityContextProps } from "./types";
import { MetricTypesEnum } from "@/lib/client/constants";
import { formatUnits } from "viem";
import { useTimeSeriesData } from "@/hooks/useTimeSeriesDataFromGraphQL";
import { useActiveSupply } from "@/hooks/useActiveSupply";
import { useProposals } from "@/hooks/useProposals";
import { useVotes } from "@/hooks/useVotes";
import { useAverageTurnout } from "@/hooks/useAverageTurnout";

const initialGovernanceActivityMetricData = {
  value: undefined,
  changeRate: undefined,
};

export const GovernanceActivityContext =
  createContext<GovernanceActivityContextProps>({
    days: TimeInterval.NINETY_DAYS,
    setDays: () => {},
    treasury: initialGovernanceActivityMetricData,
    setTreasury: () => {},
    treasurySupplyChart: [],
    setTreasurySupplyChart: () => {},
    proposals: initialGovernanceActivityMetricData,
    activeSupply: initialGovernanceActivityMetricData,
    votes: initialGovernanceActivityMetricData,
    averageTurnout: initialGovernanceActivityMetricData,
  });

export const GovernanceActivityProvider = ({
  children,
  daoId,
}: {
  children: React.ReactNode;
  daoId: DaoIdEnum;
}) => {
  const [days, setDays] = useState<TimeInterval>(TimeInterval.NINETY_DAYS);
  const [treasury, setTreasury] = useState<MetricData>(
    initialGovernanceActivityMetricData,
  );
  const [treasurySupplyChart, setTreasurySupplyChart] = useState<
    DaoMetricsDayBucket[]
  >([]);

  const parsedDays = useMemo(() => parseInt(days.split("d")[0]), [days]);

  // Use SWR hook for treasury data
  const { data: treasuryData, error: treasuryError } = useTimeSeriesData(
    daoId,
    [MetricTypesEnum.TREASURY],
    parsedDays,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    },
  );

  // Use SWR hook for active supply data
  const { data: activeSupplyData } = useActiveSupply(daoId, days, {
    refreshInterval: 300000, // Refresh every 5 minutes
    revalidateOnFocus: false,
  });

  // Use SWR hook for proposals data
  const { data: proposalsData } = useProposals(daoId, days, {
    refreshInterval: 300000, // Refresh every 5 minutes
    revalidateOnFocus: false,
  });

  // Use SWR hook for votes data
  const { data: votesData } = useVotes(daoId, days, {
    refreshInterval: 300000, // Refresh every 5 minutes
    revalidateOnFocus: false,
  });

  // Use SWR hook for average turnout data
  const { data: averageTurnoutData } = useAverageTurnout(daoId, days, {
    refreshInterval: 300000, // Refresh every 5 minutes
    revalidateOnFocus: false,
  });

  // Fetch remaining governance data
  useEffect(() => {
    const fetchGovernanceData = async () => {
      try {
        // Process treasury data from SWR
        if (treasuryData) {
          const data = treasuryData[MetricTypesEnum.TREASURY];
          const currentHigh = data[data.length - 1]?.high ?? "0";
          const oldHigh = data[0]?.high ?? "0";
          const changeRate =
            currentHigh === "0"
              ? "0"
              : formatUnits(
                  (BigInt(currentHigh) * BigInt(1e18)) / BigInt(oldHigh) -
                    BigInt(1e18),
                  18,
                );
          setTreasury({
            value: String(BigInt(currentHigh) / BigInt(10 ** 18)),
            changeRate: changeRate,
          });
          setTreasurySupplyChart(data);
        }
      } catch (error) {
        console.error("Error fetching governance metrics", error);
      }
    };

    fetchGovernanceData();
  }, [
    daoId,
    days,
    treasuryData,
    treasuryError,
    proposalsData,
    votesData,
    averageTurnoutData,
  ]);

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
