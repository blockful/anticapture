"use client";

import { ThePieChart } from "@/features/holders-and-delegates/components/ThePieChart";
import { VotingPowerTable } from "@/features/holders-and-delegates/components/VotingPowerTable";
import { DaoIdEnum } from "@/shared/types/daos";
import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";
import { PIE_CHART_COLORS } from "@/features/holders-and-delegates/utils";
import { formatNumberUserReadable } from "@/shared/utils";

const chartConfig: Record<string, { label: string; color: string }> = {
  delegatedSupply: {
    label: "Delegated Supply",
    color: "var(--base-chart-1)",
  },
  cexSupply: {
    label: "CEX Supply",
    color: "var(--base-chart-3)",
  },
  dexSupply: {
    label: "DEX Supply",
    color: "var(--base-chart-5)",
  },
  lendingSupply: {
    label: "Lending Supply",
    color: "var(--base-chart-7)",
  },
};

const ChartLegend = ({
  items,
}: {
  items: { color: string; label: string }[];
}) => (
  <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:justify-normal sm:gap-3">
    {items.map((item) => (
      <div key={item.label} className="flex items-center gap-2">
        <span
          className="size-2 rounded-xs"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-secondary text-sm font-medium">{item.label}</span>
      </div>
    ))}
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
    delegatorsVotingPowerDetails,
    loading,
    votingPowerHistoryData: votingPowerHistoryDelegators,
  } = useVotingPower({
    daoId,
    address: delegate,
  });

  const accountBalnceMapping = (address: string) => {
    return delegatorsVotingPowerDetails?.accountBalances?.items.find(
      (accBalance) => accBalance.delegate === address,
    )?.balance;
  };

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="border-light-dark text-primary flex h-full w-full flex-col gap-4 overflow-y-auto border p-4 sm:flex-row">
        <div className="flex h-full w-full flex-col">
          <div className="flex w-full flex-row gap-4">
            <div className="size-56">
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
                    formatNumberUserReadable(
                      Number(
                        BigInt(
                          delegatorsVotingPowerDetails?.accountPower
                            ?.votingPower,
                        ) / BigInt(10 ** 18),
                      ),
                    ) || 0
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
                  {loading ? (
                    <div className="text-secondary text-sm">
                      Loading delegators...
                    </div>
                  ) : votingPowerHistoryDelegators &&
                    votingPowerHistoryDelegators.length > 0 ? (
                    votingPowerHistoryDelegators.map((delegator, index) => (
                      <div
                        key={index}
                        className="hover:bg-surface-hover flex items-center justify-between gap-2 rounded-md p-2"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="bg-surface-action size-2 rounded-xs"
                            style={{
                              backgroundColor:
                                PIE_CHART_COLORS[
                                  index % PIE_CHART_COLORS.length
                                ],
                            }}
                          />
                          <span className="text-sm font-medium">
                            {delegator.delegation?.delegatorAccountId}
                          </span>
                        </div>
                        <span className="text-secondary text-sm">
                          {accountBalnceMapping(
                            delegator.delegation?.delegatorAccountId ?? "",
                          ) || 0}
                        </span>
                      </div>
                    ))
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
      <div className="flex w-full gap-4">
        <VotingPowerTable address={address} daoId={daoId} />
      </div>
    </div>
  );
};
