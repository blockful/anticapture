"use client";

import { useMultipleEnsData } from "@/shared/hooks/useEnsData";
import {
  GetDelegationHistoryItemsQuery,
  GetVotingPowerCountingQuery,
} from "@anticapture/graphql-client";
import { useApolloClient } from "@apollo/client";
import { Address, zeroAddress } from "viem";
import { TopAccountChartData } from "@/features/dao-overview/components/TopAccountsChart";
import { DaoIdEnum } from "@/shared/types/daos";
import { useEffect, useState, useMemo } from "react";
import {
  GetDelegationHistoryItemsDocument,
  GetVotingPowerCountingDocument,
} from "@anticapture/graphql-client/hooks";

interface UseTopAccountsChartDataParams {
  chartData: TopAccountChartData[];
  daoId: DaoIdEnum;
}

type DelegationItems = GetDelegationHistoryItemsQuery["delegations"]["items"];

export function useTopAccountsChartData({
  chartData,
  daoId,
}: UseTopAccountsChartDataParams) {
  const client = useApolloClient();

  const [delegationData, setDelegationData] = useState<
    Record<string, DelegationItems>
  >({});
  const [votingPowerCounts, setVotingPowerCounts] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const addresses = useMemo(
    () => chartData.map((item) => item.address as Address),
    [chartData],
  );

  const delegateAddresses = useMemo(() => {
    return addresses
      .map((address) => {
        const latestDelegation = delegationData[address]?.find(
          (item) => item.delegateAccountId !== zeroAddress,
        );
        return latestDelegation?.delegateAccountId as Address | undefined;
      })
      .filter((address): address is Address => !!address);
  }, [addresses, delegationData]);

  const { data: ensData } = useMultipleEnsData([
    ...addresses,
    ...delegateAddresses,
  ]);

  useEffect(() => {
    let cancelled = false;

    const fetchAllData = async () => {
      if (addresses.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [delegationResults, votingPowerResults] = await Promise.all([
          // Fetch delegations
          Promise.all(
            addresses.map((address) =>
              client.query<GetDelegationHistoryItemsQuery>({
                query: GetDelegationHistoryItemsDocument,
                variables: {
                  delegator: address,
                  orderBy: "timestamp",
                  orderDirection: "desc",
                  limit: 10,
                },
                context: {
                  headers: {
                    "anticapture-dao-id": daoId,
                  },
                },
              }),
            ),
          ),
          // Fetch voting power counts
          Promise.all(
            addresses.map((address) =>
              client.query<GetVotingPowerCountingQuery>({
                query: GetVotingPowerCountingDocument,
                variables: {
                  address: address,
                },
                context: {
                  headers: {
                    "anticapture-dao-id": daoId,
                  },
                },
              }),
            ),
          ),
        ]);

        if (cancelled) return;

        const dataByAddress = addresses.reduce(
          (acc, address, index) => {
            acc[address] =
              delegationResults[index].data?.delegations?.items || [];
            return acc;
          },
          {} as Record<string, DelegationItems>,
        );

        const countsByAddress = addresses.reduce(
          (acc, address, index) => {
            acc[address] =
              votingPowerResults[index].data?.accountBalances?.totalCount || 0;
            return acc;
          },
          {} as Record<string, number>,
        );

        setDelegationData(dataByAddress);
        setVotingPowerCounts(countsByAddress);
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error("Unknown error");
          setError(error);
          console.error("Error fetching data:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      cancelled = true;
    };
  }, [addresses, daoId, client]);

  const processedData = useMemo(() => {
    return chartData.map((item) => {
      const latestDelegation = delegationData[item.address]?.find(
        (delegation) => delegation.delegateAccountId !== zeroAddress,
      );

      const delegateAddress = latestDelegation?.delegateAccountId as
        | Address
        | undefined;

      return {
        ...item,
        name: ensData?.[item.address as Address]?.ens,
        latestDelegate: delegateAddress
          ? ensData?.[delegateAddress]?.ens || delegateAddress
          : undefined,
        totalDelegators: votingPowerCounts[item.address] || 0,
      };
    });
  }, [chartData, delegationData, ensData, votingPowerCounts]);

  return {
    data: processedData,
    loading,
    error,
  };
}
