/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { TimeInterval } from "@/lib/enums/TimeInterval";
import {
  DaoMetricsDayBucket,
  fetchActiveSupply,
  fetchAverageTurnout,
  fetchProposals,
  fetchTimeSeriesDataFromGraphQL,
  fetchVotes,
} from "@/lib/server/backend";
import { DaoIdEnum } from "@/lib/types/daos";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { MetricData, GovernanceActivityContextProps } from "./types";
import { MetricTypesEnum } from "@/lib/client/constants";
import { formatUnits } from "viem";
import { formatVariation } from "@/lib/client/utils";

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
    setProposals: () => {},

    activeSupply: initialGovernanceActivityMetricData,
    setActiveSupply: () => {},

    votes: initialGovernanceActivityMetricData,
    setVotes: () => {},

    averageTurnout: initialGovernanceActivityMetricData,
    setAverageTurnout: () => {},
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
  const [proposals, setProposals] = useState<MetricData>(
    initialGovernanceActivityMetricData,
  );

  const [activeSupply, setActiveSupply] = useState<MetricData>(
    initialGovernanceActivityMetricData,
  );

  const [votes, setVotes] = useState<MetricData>(
    initialGovernanceActivityMetricData,
  );

  const [averageTurnout, setAverageTurnout] = useState<MetricData>(
    initialGovernanceActivityMetricData,
  );

  const fetchGovernanceActivityData = useCallback(async () => {
    try {
      const [
        treasuryData,
        proposalsData,
        activeSupplyData,
        votesData,
        averageTurnoutData,
      ] = await Promise.all([
        fetchTimeSeriesDataFromGraphQL(
          daoId,
          MetricTypesEnum.TREASURY,
          parseInt(days.split("d")[0]),
        ),
        fetchProposals({ daoId, days }),
        fetchActiveSupply({ daoId, days }),
        fetchVotes({ daoId, days }),
        fetchAverageTurnout({ daoId, days }),
      ]);

      if (treasuryData) {
        const currentHigh = treasuryData[treasuryData.length - 1]?.high ?? "0";
        const oldHigh = treasuryData[0]?.high ?? "0";
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
        setTreasurySupplyChart(treasuryData);
      }

      if (proposalsData) {
        setProposals({
          value: String(proposalsData.currentProposalsLaunched),
          changeRate: proposalsData.changeRate,
        });
      }

      if (activeSupplyData) {
        setActiveSupply({
          value: activeSupplyData.activeSupply,
          changeRate: undefined,
        });
      }

      if (votesData) {
        setVotes({
          value: votesData.currentVotes,
          changeRate: votesData.changeRate,
        });
      }

      if (averageTurnoutData) {
        setAverageTurnout({
          value: String(
            BigInt(averageTurnoutData.currentAverageTurnout) / BigInt(10 ** 18),
          ),
          changeRate: averageTurnoutData.changeRate,
        });
      }
    } catch (error) {
      console.error("Error serching governance metrics", error);
    }
  }, [days, daoId]);

  useEffect(() => {
    fetchGovernanceActivityData();
  }, [fetchGovernanceActivityData]);

  return (
    <GovernanceActivityContext.Provider
      value={{
        days,
        setDays,
        treasury,
        setTreasury,
        treasurySupplyChart,
        setTreasurySupplyChart,
        proposals,
        setProposals,
        activeSupply,
        setActiveSupply,
        votes,
        setVotes,
        averageTurnout,
        setAverageTurnout,
      }}
    >
      {children}
    </GovernanceActivityContext.Provider>
  );
};

export const useGovernanceActivityContext = () =>
  useContext(GovernanceActivityContext);
