import { DaoIdEnum } from "@/shared/types/daos";
import { GetProposalQuery } from "@anticapture/graphql-client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useNonVoters,
  NonVoter,
} from "@/features/governance/hooks/useNonVoters";
import { SkeletonRow, Button } from "@/shared/components";
import { ColumnDef } from "@tanstack/react-table";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { ArrowUp, ArrowDown } from "lucide-react";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { VotesTable } from "@/features/governance/components/proposal-overview/VotesTable";
import { formatEther } from "viem";

export const TabsDidntVoteContent = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  const loadingRowRef = useRef<HTMLTableRowElement>(null);
  const { daoId } = useParams();

  // State for managing sort order
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Handle sorting - for non-voters we only sort by voting power
  const handleSort = useCallback(() => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  }, [sortDirection]);

  // Get non-voters for this proposal
  const {
    nonVoters,
    loading,
    error,
    loadMore,
    hasNextPage,
    isLoadingMore,
    totalCount,
  } = useNonVoters({
    proposalId: proposal.id,
    daoId: (daoId as string)?.toUpperCase() as DaoIdEnum,
    limit: 10, // Load 10 items at a time
    orderDirection: sortDirection,
  });

  // Intersection observer on the loading row
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (loadingRowRef.current) {
      observer.observe(loadingRowRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isLoadingMore, loadMore]);

  const columns: ColumnDef<NonVoter>[] = useMemo(
    () => [
      {
        accessorKey: "voter",
        size: 200,
        cell: ({ row }) => {
          const voterAddress = row.getValue("voter") as string;

          // Handle loading row
          if (voterAddress === "__LOADING_ROW__") {
            return (
              <div
                ref={loadingRowRef}
                className="flex h-10 items-center gap-3 p-2"
              >
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="size-6 rounded-full"
                />
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-4 w-24"
                />
              </div>
            );
          }

          // Handle skeleton data (empty objects from initial load)
          if (!voterAddress) {
            return (
              <div className="flex h-10 items-center gap-3 p-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="size-6 rounded-full"
                />
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-4 w-24"
                />
              </div>
            );
          }

          return (
            <div className="flex h-10 w-full items-center gap-3 p-2">
              <EnsAvatar
                address={voterAddress as `0x${string}`}
                size="sm"
                variant="rounded"
                showName={true}
                isDashed={true}
              />
            </div>
          );
        },
        header: () => (
          <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
            <p>Voter</p>
          </div>
        ),
      },
      {
        accessorKey: "lastVoteTimestamp",
        size: 150,
        cell: ({ row }) => {
          const timestamp = row.getValue("lastVoteTimestamp") as string;
          const voterAddress = row.getValue("voter") as string;

          // Handle loading row
          if (voterAddress === "__LOADING_ROW__") {
            return (
              <div className="flex h-10 items-center p-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-4 w-20"
                />
              </div>
            );
          }

          // Handle skeleton data (empty objects from initial load)
          if (!voterAddress) {
            return (
              <div className="flex h-10 items-center p-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-4 w-20"
                />
              </div>
            );
          }

          const date = timestamp ? new Date(Number(timestamp) * 1000) : null;
          const formattedDate = date
            ? date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Never";

          return (
            <div className="flex h-10 items-center p-2">
              <span className="text-secondary text-sm">{formattedDate}</span>
            </div>
          );
        },
        header: () => (
          <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
            <p>Last Vote Date</p>
          </div>
        ),
      },
      {
        accessorKey: "votingPower",
        size: 180,
        cell: ({ row }) => {
          const votingPower = row.getValue("votingPower") as string;
          const voterAddress = row.getValue("voter") as string;

          // Handle loading row
          if (voterAddress === "__LOADING_ROW__") {
            return (
              <div className="flex h-10 items-center p-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-4 w-24"
                />
              </div>
            );
          }

          // Handle skeleton data (empty objects from initial load)
          if (!voterAddress) {
            return (
              <div className="flex h-10 items-center p-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-4 w-24"
                />
              </div>
            );
          }

          const votingPowerNum = votingPower ? Number(votingPower) / 1e18 : 0;
          const formattedVotingPower = formatNumberUserReadable(votingPowerNum);

          // Calculate percentage of total voting power
          const totalVotingPower =
            Number(proposal.forVotes || 0) +
            Number(proposal.againstVotes || 0) +
            Number(proposal.abstainVotes || 0);
          const percentage =
            totalVotingPower > 0
              ? ((votingPowerNum / (totalVotingPower / 1e18)) * 100).toFixed(1)
              : "0.0";

          return (
            <div className="flex h-10 items-center p-2">
              <div className="flex flex-col">
                <span className="text-primary text-sm font-medium">
                  {formattedVotingPower} ({percentage}%)
                </span>
              </div>
            </div>
          );
        },
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            className="text-secondary w-full justify-start"
            onClick={handleSort}
          >
            <h4 className="text-table-header whitespace-nowrap">
              Voting Power (CAT)
            </h4>
            <ArrowUpDown
              props={{ className: "size-4 ml-1" }}
              activeState={
                sortDirection === "asc" ? ArrowState.UP : ArrowState.DOWN
              }
            />
          </Button>
        ),
      },
      {
        accessorKey: "votingPowerVariation",
        size: 150,
        cell: ({ row }) => {
          const voterAddress = row.getValue("voter") as string;
          const votingPowerVariation = row.getValue(
            "votingPowerVariation",
          ) as string;

          // Handle loading row
          if (voterAddress === "__LOADING_ROW__") {
            return (
              <div className="flex h-10 items-center p-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-4 w-16"
                />
              </div>
            );
          }

          // Handle skeleton data (empty objects from initial load)
          if (!voterAddress) {
            return (
              <div className="flex h-10 items-center p-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-4 w-16"
                />
              </div>
            );
          }

          // Calculate percentage change from absolute variation
          const currentVotingPower = row.original.votingPower;
          const currentVP = currentVotingPower
            ? Number(formatEther(BigInt(currentVotingPower)))
            : 0;
          const variation = votingPowerVariation
            ? Number(formatEther(BigInt(votingPowerVariation)))
            : 0;
          const historicalVP = currentVP - variation;
          const changePercentage =
            historicalVP !== 0 ? (variation / historicalVP) * 100 : 0;

          // Determine the direction and color
          const isPositive = changePercentage > 0;
          const isNegative = changePercentage < 0;
          const isNeutral = changePercentage === 0;

          // Get the appropriate arrow icon
          const getArrowIcon = () => {
            if (isPositive) {
              return <ArrowUp className="text-success h-4 w-4" />;
            } else if (isNegative) {
              return <ArrowDown className="text-error h-4 w-4" />;
            } else {
              return null;
            }
          };

          return (
            <div className="flex h-10 items-center p-2">
              <div className="flex items-center gap-1">
                {getArrowIcon()}
                <span
                  className={cn(
                    "text-sm font-medium",
                    isPositive && "text-success",
                    isNegative && "text-error",
                    isNeutral && "text-secondary",
                  )}
                >
                  {Math.abs(changePercentage).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        },
        header: () => (
          <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
            <p>VP Change (Last 30d)</p>
          </div>
        ),
      },
    ],
    [proposal, handleSort, sortDirection],
  );

  // Prepare table data with loading row if needed
  const tableData = useMemo(() => {
    const data: NonVoter[] = [...nonVoters];

    // Add loading row if there are more pages or currently loading
    if (hasNextPage || isLoadingMore) {
      data.push({
        voter: "__LOADING_ROW__",
        lastVoteTimestamp: 0,
        votingPower: "",
        votingPowerVariation: "",
        isSubRow: false,
      } as NonVoter);
    }

    return data;
  }, [nonVoters, hasNextPage, isLoadingMore]);

  // Show skeleton table on initial load or when we have no valid data
  const hasValidData =
    nonVoters.length > 0 &&
    nonVoters.some(
      (nonVoter) => nonVoter.voter && nonVoter.voter !== "__LOADING_ROW__",
    );

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (loading && !hasValidData) {
    return (
      <div className="w-full">
        <VotesTable
          columns={columns}
          data={Array.from({ length: 7 }, () => ({}) as NonVoter)}
        />
      </div>
    );
  }

  // Show message if no non-voters
  if (!loading && totalCount === 0) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <p className="text-secondary text-sm">
          All eligible voters participated in this proposal
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <VotesTable columns={columns} data={tableData} />
    </div>
  );
};
