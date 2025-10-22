import { DaoIdEnum } from "@/shared/types/daos";
import { GetProposalQuery } from "@anticapture/graphql-client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useVotes,
  VoteWithHistoricalPower,
} from "@/features/governance/hooks/useVotes";
import { SkeletonRow, Button } from "@/shared/components";
import { ColumnDef } from "@tanstack/react-table";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import {
  CheckCircle2,
  CircleMinus,
  ThumbsDown,
  XCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { VotesTable } from "@/features/governance/components/proposal-overview/VotesTable";

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
        setSortBy(field);
        setSortDirection("desc");
      }
    },
    [sortBy, sortDirection],
  );

  // Get votes for this proposal
  const { votes, loading, error, loadMore, hasNextPage, isLoadingMore } =
    useVotes({
      proposalId: proposal.id,
      daoId: (daoId as string)?.toUpperCase() as DaoIdEnum,
      limit: 10, // Load 10 items at a time
      orderBy: sortBy,
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

  const columns: ColumnDef<VoteWithHistoricalPower>[] = useMemo(
    () => [
      {
        accessorKey: "voterAccountId",
        size: 200,
        cell: ({ row }) => {
          const voterAddress = row.getValue("voterAccountId") as string;
          const vote = row.original;

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

          // Handle description sub-row - this will be handled in the table row rendering
          if (vote.isSubRow && voterAddress.startsWith("__DESCRIPTION_")) {
            return null; // This cell will be empty, the description will span all columns
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
        accessorKey: "support",
        size: 120,
        cell: ({ row }) => {
          const support = row.getValue("support") as string;
          const voterAddress = row.getValue("voterAccountId") as string;
          const vote = row.original;

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

          // Handle description sub-row - show empty for other columns
          if (vote.isSubRow && voterAddress.startsWith("__DESCRIPTION_")) {
            return <div className="flex h-10 items-center p-2" />;
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
          const vote = row.original;

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

          // Handle description sub-row - show empty for other columns
          if (vote.isSubRow && voterAddress.startsWith("__DESCRIPTION_")) {
            return <div className="flex h-10 items-center p-2" />;
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
              <span className="text-secondary whitespace-nowrap text-sm">
                {formattedDate}
              </span>
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
        size: 160,
        cell: ({ row }) => {
          const votingPower = row.getValue("votingPower") as string;
          const voterAddress = row.getValue("voterAccountId") as string;
          const vote = row.original;

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

          // Handle description sub-row - show empty for other columns
          if (vote.isSubRow && voterAddress.startsWith("__DESCRIPTION_")) {
            return <div className="flex h-10 items-center p-2" />;
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
          <Button
            variant="ghost"
            size="sm"
            className="text-secondary w-full justify-start"
            onClick={() => handleSort("votingPower")}
          >
            <h4 className="text-table-header whitespace-nowrap">
              Voting Power (CAT)
            </h4>
            <ArrowUpDown
              props={{ className: "size-4 ml-1" }}
              activeState={
                sortBy === "votingPower"
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
        accessorKey: "historicalVotingPower",
        size: 160,
        cell: ({ row }) => {
          const voterAddress = row.getValue("voterAccountId") as string;
          const historicalVotingPower = row.getValue(
            "historicalVotingPower",
          ) as string | undefined;
          const currentVotingPower = row.original.votingPower;
          const vote = row.original;

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

          // Handle description sub-row - show empty for other columns
          if (vote.isSubRow && voterAddress.startsWith("__DESCRIPTION_")) {
            return <div className="flex h-10 items-center p-2" />;
          }

          // If no historical voting power data yet, show loading state
          if (!historicalVotingPower) {
            return (
              <div className="flex h-10 items-center p-2">
                <span className="text-secondary text-sm">Loading...</span>
              </div>
            );
          }

          // Calculate the change
          const currentVP = currentVotingPower
            ? Number(currentVotingPower) / 1e18
            : 0;
          const historicalVP = Number(historicalVotingPower) / 1e18;
          const change = currentVP - historicalVP;
          const changePercentage =
            historicalVP > 0 ? (change / historicalVP) * 100 : 0;

          // Determine the direction and color
          const isPositive = change > 0;
          const isNegative = change < 0;
          const isNeutral = change === 0;

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
          <div className="text-table-header flex h-8 w-full shrink-0 items-center justify-start whitespace-nowrap px-2">
            <p>VP Change (Last 30d)</p>
          </div>
        ),
      },
    ],
    [proposal, handleSort, sortBy, sortDirection],
  );

  // Prepare table data with description rows and loading row if needed
  const tableData = useMemo(() => {
    const data: VoteWithHistoricalPower[] = [];

    // Add votes with their description rows
    votes.forEach((vote) => {
      // Add the main vote row
      data.push(vote);

      // Add description row if the vote has a reason
      if (vote.reason && vote.reason.trim() !== "") {
        data.push({
          voterAccountId: `__DESCRIPTION_${vote.voterAccountId}__`,
          txHash: "",
          daoId: vote.daoId,
          proposalId: vote.proposalId,
          support: "",
          votingPower: "",
          reason: vote.reason,
          timestamp: "",
          historicalVotingPower: undefined,
          isSubRow: true,
        } as VoteWithHistoricalPower);
      }
    });

    // Add loading row if there are more pages or currently loading
    if (hasNextPage || isLoadingMore) {
      data.push({
        voterAccountId: "__LOADING_ROW__",
        txHash: "",
        daoId: "",
        proposalId: "",
        support: "",
        votingPower: "",
        reason: "",
        timestamp: "",
        historicalVotingPower: undefined,
        isSubRow: false,
      } as VoteWithHistoricalPower);
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
        <VotesTable
          columns={columns}
          data={Array.from(
            { length: 7 },
            () => ({}) as VoteWithHistoricalPower,
          )}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <VotesTable columns={columns} data={tableData} />
    </div>
  );
};
