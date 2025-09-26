import { DaoIdEnum } from "@/shared/types/daos";
import { GetProposalQuery, VotesOnchain } from "@anticapture/graphql-client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVotes } from "@/features/governance/hooks/useVotes";
import { SkeletonRow, TheTable, Button } from "@/shared/components";
import { ColumnDef } from "@tanstack/react-table";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { CheckCircle2, CircleMinus, ThumbsDown, XCircle } from "lucide-react";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";

export const TabsVotedContent = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  const loadingRowRef = useRef<HTMLTableRowElement>(null);
  const { daoId } = useParams();

  // State for managing sort order
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Handle sorting
  const handleSort = useCallback(
    (field: string) => {
      if (sortBy === field) {
        // Toggle direction if same field
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        // New field, default to desc for timestamp
        setSortBy(field);
        setSortDirection("desc");
      }
    },
    [sortBy, sortDirection],
  );

  // Get votes for this proposal
  const {
    votes,
    loading,
    error,
    totalCount,
    loadMore,
    hasNextPage,
    isLoadingMore,
  } = useVotes({
    proposalId: proposal.id,
    daoId: (daoId as string)?.toUpperCase() as DaoIdEnum,
    limit: 10, // Load 10 items at a time
    orderBy: sortBy,
    orderDirection: sortDirection,
  });

  console.log(votes);

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

  const columns: ColumnDef<VotesOnchain>[] = useMemo(
    () => [
      {
        accessorKey: "voterAccountId",
        size: 200,
        cell: ({ row }) => {
          const voterAddress = row.getValue("voterAccountId") as string;

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
            <div className="flex h-10 items-center gap-3 p-2">
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
        accessorKey: "support",
        size: 120,
        cell: ({ row }) => {
          const support = row.getValue("support") as string;
          const voterAddress = row.getValue("voterAccountId") as string;

          // Handle loading row
          if (voterAddress === "__LOADING_ROW__") {
            return (
              <div className="flex h-10 items-center p-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-6 w-16"
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
                  className="h-6 w-16"
                />
              </div>
            );
          }

          const getChoiceInfo = (support: string) => {
            switch (support) {
              case "1":
                return {
                  label: "For",
                  icon: <CheckCircle2 className="text-success size-4" />,
                };
              case "0":
                return {
                  label: "Against",
                  icon: <XCircle className="text-error size-4" />,
                };
              case "2":
                return {
                  label: "Abstain",
                  icon: <CircleMinus className="text-secondary size-4" />,
                };
              default:
                return {
                  label: "Unknown",
                  icon: <ThumbsDown className="text-secondary size-4" />,
                };
            }
          };

          const choiceInfo = getChoiceInfo(support);

          return (
            <div className="flex items-center p-2">
              <div
                className={cn("flex items-center gap-2 rounded-full px-3 py-1")}
              >
                {choiceInfo.icon}
                <span className={cn("text-sm font-medium")}>
                  {choiceInfo.label}
                </span>
              </div>
            </div>
          );
        },
        header: () => (
          <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
            <p>Choice</p>
          </div>
        ),
      },
      {
        accessorKey: "timestamp",
        size: 120,
        cell: ({ row }) => {
          const timestamp = row.getValue("timestamp") as string;
          const voterAddress = row.getValue("voterAccountId") as string;

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
            : "Unknown";

          return (
            <div className="flex h-10 items-center p-2">
              <span className="text-secondary text-sm">{formattedDate}</span>
            </div>
          );
        },
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            className="text-secondary w-full justify-start"
            onClick={() => handleSort("timestamp")}
          >
            <h4 className="text-table-header whitespace-nowrap">Date</h4>
            <ArrowUpDown
              props={{ className: "size-4 ml-1" }}
              activeState={
                sortBy === "timestamp"
                  ? sortDirection === "asc"
                    ? ArrowState.UP
                    : ArrowState.DOWN
                  : ArrowState.DEFAULT
              }
            />
          </Button>
        ),
      },
      {
        accessorKey: "votingPower",
        size: 150,
        cell: ({ row }) => {
          const votingPower = row.getValue("votingPower") as string;
          const voterAddress = row.getValue("voterAccountId") as string;

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

          // Calculate percentage - you might need to get total voting power from proposal
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
          <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
            <p>Voting Power (CAT)</p>
          </div>
        ),
      },
      {
        accessorKey: "vpChange",
        size: 150,
        cell: ({ row }) => {
          const voterAddress = row.getValue("voterAccountId") as string;

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

          return (
            <div className="flex h-10 items-center p-2">
              <span className={cn("text-sm font-medium")}>
                not showing for now
              </span>
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
    [proposal, handleSort, sortBy, sortDirection],
  );

  // Prepare table data with loading row if needed
  const tableData = useMemo(() => {
    const data = [...votes];

    // Add loading row if there are more pages or currently loading
    if (hasNextPage || isLoadingMore) {
      data.push({
        voterAccountId: "__LOADING_ROW__",
        txHash: null,
        daoId: "",
        proposalId: null,
        support: null,
        votingPower: null,
        reason: null,
        timestamp: null,
      } as VotesOnchain);
    }

    return data;
  }, [votes, hasNextPage, isLoadingMore]);

  // Show skeleton table on initial load or when we have no valid data
  const hasValidData =
    votes.length > 0 &&
    votes.some(
      (vote) =>
        vote.voterAccountId && vote.voterAccountId !== "__LOADING_ROW__",
    );

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (loading && !hasValidData) {
    return (
      <div className="w-full">
        <TheTable
          columns={columns}
          data={Array.from({ length: 7 }, () => ({}) as VotesOnchain)}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <TheTable columns={columns} data={tableData} />

      {/* End state */}
      {!hasNextPage && votes.length > 0 && (
        <div className="flex items-center justify-center p-4">
          <div className="text-secondary text-sm">
            Showing all {totalCount} votes
          </div>
        </div>
      )}
    </div>
  );
};
