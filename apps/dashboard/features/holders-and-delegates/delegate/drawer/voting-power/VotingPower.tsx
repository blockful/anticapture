"use client";

import { ThePieChart } from "@/features/holders-and-delegates/delegate/drawer/voting-power/ThePieChart";
import { VotingPowerTable } from "@/features/holders-and-delegates/delegate/drawer/voting-power/VotingPowerTable";
import { DaoIdEnum } from "@/shared/types/daos";
import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";
import { PIE_CHART_COLORS } from "@/features/holders-and-delegates/utils";
import { formatNumberUserReadable } from "@/shared/utils";
import { formatAddress } from "@/shared/utils/formatAddress";
import { Pagination } from "@/shared/components/design-system/table/Pagination";

// Create chart config for delegators with percentages
const createDelegatorsChartConfig = (
  delegators: any[],
  othersValue: number,
  currentVotingPower: number,
): Record<string, { label: string; color: string; percentage: string }> => {
  const config: Record<
    string,
    { label: string; color: string; percentage: string }
  > = {};

  // Add delegators to config
  delegators.forEach((delegator, index) => {
    const key = delegator.accountId || `delegator-${index}`;
    const percentage = (
      (Number(delegator.balance) / currentVotingPower) *
      100
    ).toFixed(1);
    config[key] = {
      label: `${formatAddress(delegator.accountId || "")}`,
      color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
      percentage: percentage,
    };
  });

  // Add Others if there's remaining voting power
  if (othersValue > 0) {
    const percentage = ((othersValue / currentVotingPower) * 100).toFixed(1);
    config["others"] = {
      label: "Others",
      color: "#9CA3AF", // Gray color for Others
      percentage: percentage,
    };
  }

  return config;
};

const ChartLegend = ({
  items,
}: {
  items: { color: string; label: string; percentage: string }[];
}) => (
  <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:justify-normal sm:gap-3">
    {items.map((item) => {
      if (Number(item.percentage) < 0.08) return null;
      return (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className="size-2 rounded-xs"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-secondary flex flex-row gap-2 text-sm font-medium">
            {item.label}
            <span
              className="text-secondary text-sm font-medium"
              style={{
                color: item.color,
              }}
            >
              {item.percentage}%
            </span>
          </span>
        </div>
      );
    })}
  </div>
);

export const VotingPower = ({
  address,
  daoId,
}: {
  address: string;
  daoId: DaoIdEnum;
}) => {
  const delegate: string = address;
  const {
    top5Delegators,
    delegatorsVotingPowerDetails,
    loading,
    pagination,
    fetchPreviousPage,
    fetchNextPage,
    fetchingMore,
  } = useVotingPower({
    daoId,
    address: delegate,
  });

  if (
    !top5Delegators ||
    top5Delegators.length === 0 ||
    !delegatorsVotingPowerDetails ||
    !delegatorsVotingPowerDetails.accountPower ||
    !delegatorsVotingPowerDetails.accountPower.votingPower
  ) {
    return null;
  }

  const currentVotingPower = Number(
    BigInt(delegatorsVotingPowerDetails?.accountPower?.votingPower) /
      BigInt(10 ** 18),
  );

  const totalTop5Delegators = top5Delegators?.reduce((acc, item) => {
    return acc + Number(item.balance);
  }, 0);

  const othersValue = Math.abs(totalTop5Delegators - currentVotingPower);

  const chartConfig = createDelegatorsChartConfig(
    top5Delegators,
    othersValue,
    currentVotingPower,
  );

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="border-light-dark text-primary flex h-fit w-full flex-col gap-4 overflow-y-auto border p-4 sm:flex-row">
        <div className="flex h-full w-full flex-col">
          <div className="flex w-full flex-row gap-4">
            <div>
              <ThePieChart daoId={daoId} address={address} />
            </div>

            <div className="flex w-full flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-secondary text-alternative-xs font-mono font-medium uppercase">
                  Current Voting Power
                </p>
                <p className="text-md font-normal">
                  {loading ? (
                    <span className="text-secondary">Loading...</span>
                  ) : (
                    formatNumberUserReadable(currentVotingPower)
                  )}
                </p>
              </div>

              <div className="h-px w-full bg-[#27272A]" />

              {/* Delegators */}
              <div className="flex flex-col gap-2">
                <p className="text-secondary text-alternative-xs font-mono font-medium uppercase">
                  Delegators
                </p>

                <div className="scrollbar-none flex flex-col gap-4 overflow-y-auto">
                  {!top5Delegators ? (
                    <div className="text-secondary text-sm">
                      Loading delegators...
                    </div>
                  ) : top5Delegators && top5Delegators.length > 0 ? (
                    (() => {
                      // Create legend items from chartConfig
                      const legendItems = Object.entries(chartConfig).map(
                        ([key, config]: [
                          string,
                          { color: string; label: string; percentage: string },
                        ]) => ({
                          color: config.color,
                          label: config.label,
                          percentage: config.percentage,
                        }),
                      );

                      return <ChartLegend items={legendItems} />;
                    })()
                  ) : (
                    <div className="text-secondary text-sm">
                      No delegators found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col gap-4">
        <VotingPowerTable address={address} daoId={daoId} />
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPrevious={fetchPreviousPage}
          onNext={fetchNextPage}
          className="text-white"
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          isLoading={fetchingMore}
        />
      </div>
    </div>
  );
};
