"use client";

import { ThePieChart } from "@/features/holders-and-delegates/components/ThePieChart";
import { VotingPowerTable } from "@/features/holders-and-delegates/components/VotingPowerTable";
import { DaoIdEnum } from "@/shared/types/daos";
import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";
import { PIE_CHART_COLORS } from "@/features/holders-and-delegates/utils";
import { formatNumberUserReadable } from "@/shared/utils";
import { formatAddress } from "@/shared/utils/formatAddress";

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
    votingPowerHistoryData,
    fetchMore,
  } = useVotingPower({
    daoId,
    address: delegate,
  });

  // Adapt the returned items to the structure previously expected by the UI
  const votingPowerHistoryDelegators = (votingPowerHistoryData || []).map(
    (item) => {
      const balanceMatch =
        delegatorsVotingPowerDetails?.accountBalances?.items.find(
          (ab) =>
            ab.accountId.toLowerCase() ===
            (item.delegatorAccountId || "").toLowerCase(),
        );

      return {
        delegation: {
          delegatorAccountId: item.delegatorAccountId,
          delegatedValue: balanceMatch?.balance ?? "0",
        },
      } as const;
    },
  );

  console.log("delegatorsVotingPowerDetails", delegatorsVotingPowerDetails);
  console.log("loading", loading);

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
                    (() => {
                      const sorted = [...votingPowerHistoryDelegators].sort(
                        (a, b) =>
                          Number(b.delegation?.delegatedValue) -
                          Number(a.delegation?.delegatedValue),
                      );
                      const total = sorted.reduce(
                        (acc, d) => acc + Number(d.delegation?.delegatedValue),
                        0,
                      );
                      const top5 = sorted.slice(0, 5);
                      const others = sorted.slice(5);
                      const othersValue = others.reduce(
                        (acc, d) => acc + Number(d.delegation?.delegatedValue),
                        0,
                      );

                      console.log("top5", top5);

                      return (
                        <>
                          <div className="flex w-full flex-col gap-4">
                            <div className="flex flex-wrap gap-2">
                              {top5.length > 0 &&
                                top5.map((delegator, idx) => (
                                  <div
                                    key={
                                      delegator.delegation
                                        ?.delegatorAccountId || idx
                                    }
                                    className="flex items-center"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="size-2 rounded-xs"
                                        style={{
                                          backgroundColor:
                                            PIE_CHART_COLORS[
                                              idx % PIE_CHART_COLORS.length
                                            ],
                                        }}
                                      />
                                      <span className="text-sm font-medium">
                                        {formatAddress(
                                          delegator.delegation
                                            ?.delegatorAccountId || "",
                                        )}
                                      </span>
                                      <span
                                        className="text-sm font-bold"
                                        style={{
                                          color:
                                            PIE_CHART_COLORS[
                                              idx % PIE_CHART_COLORS.length
                                            ],
                                        }}
                                      >
                                        {total > 0
                                          ? `${(
                                              (Number(
                                                delegator.delegation
                                                  ?.delegatedValue,
                                              ) /
                                                total) *
                                              100
                                            ).toFixed(0)}%`
                                          : "-"}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              {others.length > 0 && (
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="size-2 rounded-xs"
                                      style={{ backgroundColor: "#9CA3AF" }}
                                    />
                                    <span className="text-sm font-medium">
                                      Others
                                    </span>
                                  </div>
                                  <span
                                    className="text-sm font-bold"
                                    style={{ color: "#9CA3AF" }}
                                  >
                                    {total > 0
                                      ? `${(
                                          (othersValue / total) *
                                          100
                                        ).toFixed(0)}%`
                                      : "-"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      );
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
      <div className="flex w-full gap-4">
        <VotingPowerTable address={address} daoId={daoId} />
      </div>
    </div>
  );
};
