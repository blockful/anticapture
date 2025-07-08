"use client";

import { ThePieChart } from "@/features/holders-and-delegates/components/ThePieChart";
import { Address } from "viem";
import { formatNumberUserReadable } from "@/shared/utils";
import { VotingPowerTable } from "@/features/holders-and-delegates/components/VotingPowerTable";

interface DelegatorItem {
  address: Address;
  delegated: number;
}

const chartConfig: Record<string, { label: string; color: string }> = {
  delegatedSupply: {
    label: "Delegated Supply",
    color: "#3B82F6",
  },
  cexSupply: {
    label: "CEX Supply",
    color: "#FB923C",
  },
  dexSupply: {
    label: "DEX Supply",
    color: "#22C55E",
  },
  lendingSupply: {
    label: "Lending Supply",
    color: "#ffbb28",
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

// Temporary mock – replace with real data when hook is ready
const mockDelegators: DelegatorItem[] = [
  {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    delegated: 12345.67,
  },
];

export const VotingPower = ({
  address,
  daoId,
}: {
  address: string;
  daoId: string;
}) => {
  // TODO: fetch real values with dedicated hook
  const currentVotingPower = 0;

  return (
    <>
      <div className="border-light-dark text-primary flex h-fit w-full flex-col gap-4 border p-4 sm:flex-row">
        <div className="fle h-full w-full flex-col">
          <div className="flex w-full flex-row gap-4">
            <div className="size-56">
              <ThePieChart />
            </div>

            <div className="flex w-full flex-col gap-6">
              {/* Current voting power */}
              <div className="flex flex-col gap-1">
                <p className="text-secondary text-alternative-xs font-mono font-medium uppercase">
                  Current Voting Power
                </p>
                <p className="text-md font-normal">
                  {formatNumberUserReadable(currentVotingPower)}
                </p>
              </div>

              <div className="h-px w-full bg-[#27272A]" />

              {/* Delegators */}
              <div className="flex flex-col gap-2">
                <p className="text-secondary text-alternative-xs font-mono font-medium uppercase">
                  Delegators
                </p>

                <div className="scrollbar-none flex flex-col gap-4 overflow-y-auto">
                  {mockDelegators.map((d) => (
                    <div
                      key={d.address}
                      className="flex items-center gap-2 rounded-md"
                    >
                      <ChartLegend items={Object.values(chartConfig)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full gap-4">
        <VotingPowerTable address={address} daoId={daoId} />
      </div>
    </>
  );
};
