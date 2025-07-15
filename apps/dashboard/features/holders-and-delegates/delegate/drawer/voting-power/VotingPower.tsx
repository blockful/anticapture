"use client";

import { ThePieChart } from "@/features/holders-and-delegates/delegate/drawer/voting-power/ThePieChart";
import { VotingPowerTable } from "@/features/holders-and-delegates/delegate/drawer/voting-power/VotingPowerTable";
import { DaoIdEnum } from "@/shared/types/daos";
import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";
import { PIE_CHART_COLORS } from "@/features/holders-and-delegates/utils";
import { formatNumberUserReadable } from "@/shared/utils";
import { formatAddress } from "@/shared/utils/formatAddress";
import { Pagination } from "@/shared/components/design-system/table/Pagination";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";

// Create chart config for delegators with percentages
const createDelegatorsChartConfig = (
  delegators: any[],
  othersValue: bigint,
  currentVotingPower: bigint,
): Record<string, { label: string; color: string; percentage: string }> => {
  const config: Record<
    string,
    { label: string; color: string; percentage: string }
  > = {};

  console.log({
    delegators,
    othersValue,
    currentVotingPower,
  });

  // Add delegators to config
  delegators.forEach((delegator, index) => {
    const key = delegator.accountId || `delegator-${index}`;

    if (delegator.rawBalance === 0) return;

    console.log({
      othersValue,
      currentVotingPower,
      delegator,
    });

    const percentage =
      (Number(BigInt(delegator.rawBalance)) / Number(currentVotingPower)) * 100;
    console.log("percentagepercentage", percentage);
    config[key] = {
      label: `${formatAddress(delegator.accountId || "")}`,
      color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
      percentage: percentage.toFixed(2),
    };
  });

  // Add Others if there's remaining voting power
  if (othersValue > BigInt(0)) {
    console.log("erntrou", othersValue);
    const percentage = Number(
      (Number(othersValue) / Number(currentVotingPower)) * 100,
    );
    console.log("percentagepercentageothers", percentage);
    config["others"] = {
      label: "Others",
      color: "#9CA3AF", // Gray color for Others
      percentage: percentage.toFixed(2),
    };
  }

  return config;
};

const ChartLegend = ({
  items,
  loading,
}: {
  items: { color: string; label: string; percentage: string }[];
  loading?: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:justify-normal sm:gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="size-2 rounded-xs"
            />
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-4 w-16"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:justify-normal sm:gap-3">
      {items.map((item) => {
        console.log("itemitem", item);
        if (Number(item.percentage) < 1 && item.label !== "Others") return null;
        return (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="size-2 rounded-xs"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-secondary flex flex-row gap-2 text-sm font-medium">
              {item.label}xas
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
};

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

  console.log("delegatorsVotingPowerDetails", delegatorsVotingPowerDetails);
  const delegateCurrentVotingPower = BigInt(
    delegatorsVotingPowerDetails?.accountPower?.votingPower,
  );

  console.log("top5Delegatorstop5Delegators", top5Delegators);
  const otherValues: ({
    __typename?: "accountBalance";
    accountId: string;
    balance: any;
  } & { rawBalance: bigint })[] = [];

  // Filtrar delegators com menos de 1% do voting power
  top5Delegators.forEach((item) => {
    if (item.rawBalance === 0n) return;

    // Calcular porcentagem usando Number para evitar divisão inteira
    const percentage = Number(
      (Number(BigInt(item.rawBalance)) / Number(delegateCurrentVotingPower)) *
        100,
    );

    if (percentage < 1) {
      console.log(
        "Delegator com menos de 1%:",
        item.accountId,
        "percentage:",
        percentage,
      );
      otherValues.push(item);
    }
  });

  console.log(
    "delegateCurrentVotingPowerdelegateCurrentVotingPower",
    delegateCurrentVotingPower,
  ); // 110747223760546237403783n

  const totalBalanceTop5Delegators = top5Delegators.reduce((acc, item) => {
    return acc + BigInt(item.rawBalance);
  }, BigInt(0));

  console.log(
    "totalBalanceTop5DelegatorstotalBalanceTop5Delegators",
    totalBalanceTop5Delegators,
  ); // 110747223760546237403783n

  const othersValue = otherValues.reduce(
    (acc, item) => acc + item.rawBalance,
    BigInt(0),
  );

  console.log("otherValues array:", otherValues);
  console.log("othersValue total:", othersValue);
  console.log("otherValues count:", otherValues.length);

  const chartConfig = createDelegatorsChartConfig(
    top5Delegators,
    othersValue,
    delegateCurrentVotingPower,
  );

  console.log("top5Delegators", {
    top5Delegators,
    delegatorsVotingPowerDetails,
  });

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
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
                  {loading &&
                  !delegateCurrentVotingPower &&
                  !top5Delegators &&
                  !delegatorsVotingPowerDetails ? (
                    <SkeletonRow
                      parentClassName="flex animate-pulse"
                      className="h-6 w-24"
                    />
                  ) : (
                    formatNumberUserReadable(Number(delegateCurrentVotingPower))
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
                  {loading &&
                  !top5Delegators &&
                  !delegatorsVotingPowerDetails ? (
                    <ChartLegend items={[]} loading={true} />
                  ) : !top5Delegators ? (
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
