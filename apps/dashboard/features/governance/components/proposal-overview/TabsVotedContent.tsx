import { DaoIdEnum } from "@/shared/types/daos";
import { GetProposalQuery } from "@anticapture/graphql-client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useVotes,
  VoteWithHistoricalPower,
} from "@/features/governance/hooks/useVotes";
import { SkeletonRow, Button, BlankSlate } from "@/shared/components";
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
  Inbox,
  ExternalLink,
} from "lucide-react";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { VotesTable } from "@/features/governance/components/proposal-overview/VotesTable";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import daoConfigByDaoId from "@/shared/dao-config";
import Link from "next/link";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { formatUnits } from "viem";
import { PERCENTAGE_NO_BASELINE } from "@/shared/constants/api";

interface TabsVotedContentProps {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
  onAddressClick?: (address: string) => void;
}

export const TabsVotedContent = ({
  proposal,
  onAddressClick,
}: TabsVotedContentProps) => {
  const loadingRowRef = useRef<HTMLTableRowElement>(null);
  const { daoId } = useParams();

  // State for managing sort order
  const [sortBy, setSortBy] = useState<string>("votingPower");
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
      proposalStartTimestamp: proposal.startTimestamp
        ? Number(proposal.startTimestamp) * 1000
        : undefined,
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
        accessorKey: "voterAddress",
        size: 200,
        cell: ({ row }) => {
          const voterAddress = row.getValue("voterAddress") as string;
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
              <button
                onClick={() => onAddressClick?.(voterAddress)}
                className="group cursor-pointer"
              >
                <EnsAvatar
                  address={voterAddress as `0x${string}`}
                  size="sm"
                  variant="rounded"
                  showName={true}
                  isDashed={true}
                  nameClassName="group-hover:border-primary transition-colors duration-200"
                />
              </button>
              <CopyAndPasteButton
                className="size-2"
                textToCopy={voterAddress}
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
          const support = row.getValue("support") as number;
          const voterAddress = row.getValue("voterAddress") as string;
          const vote = row.original;

          // Handle loading row
          if (voterAddress === "__LOADING_ROW__") {
            return (
              <div className="flex items-center gap-2 p-2">
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
              <div className="flex items-center gap-2 p-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-6 w-16"
                />
              </div>
            );
          }

          // Handle description sub-row - show empty for other columns
          if (vote.isSubRow && voterAddress.startsWith("__DESCRIPTION_")) {
            return <div className="flex items-center gap-2 p-2" />;
          }

          const getChoiceInfo = (support: number) => {
            switch (support) {
              case 1:
                return {
                  label: "For",
                  icon: <CheckCircle2 className="text-success size-4" />,
                };
              case 0:
                return {
                  label: "Against",
                  icon: <XCircle className="text-error size-4" />,
                };
              case 2:
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
            <div className="flex items-center gap-2 p-2">
              {choiceInfo.icon}
              <span className={cn("text-sm font-medium")}>
                {choiceInfo.label}
              </span>
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
          const voterAddress = row.getValue("voterAddress") as string;
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

          const formattedTime = date
            ? date.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }).toLowerCase()
            : null;

          return (
            <div className="flex h-10 flex-col items-start justify-center gap-0 p-2">
              <span className="text-secondary leading-5 text-sm whitespace-nowrap">
                {formattedDate}
              </span>
              {formattedTime && (
                <span className="text-secondary leading-[18px] text-xs">
                  {formattedTime}
                </span>
              )}
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
          const voterAddress = row.getValue("voterAddress") as string;
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
            Number(proposal.forVotes) +
            Number(proposal.againstVotes) +
            Number(proposal.abstainVotes);
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
              Voting Power ({daoId?.toString().toUpperCase()})
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
        accessorKey: "votingPowerVariation",
        size: 160,
        cell: ({ row }) => {
          const voterAddress = row.getValue("voterAddress") as string;
          const votingPowerVariation = row.getValue("votingPowerVariation") as {
            previousVotingPower: string;
            currentVotingPower: string;
            absoluteChange: string;
            percentageChange: string;
          };
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
          if (!votingPowerVariation) {
            return (
              <div className="flex h-10 items-center p-2">
                <span className="text-secondary text-sm">Loading...</span>
              </div>
            );
          }

          // Determine the direction and color
          const isPositive =
            Number(votingPowerVariation.percentageChange) > 0 ||
            votingPowerVariation.percentageChange === PERCENTAGE_NO_BASELINE;
          const isNegative = Number(votingPowerVariation.percentageChange) < 0;
          const isNeutral = Number(votingPowerVariation.percentageChange) === 0;

          // Get the appropriate arrow icon
          const getArrowIcon = () => {
            if (isPositive) {
              return <ArrowUp className="text-success h-4 w-4" />;
            }
            if (isNegative) {
              return <ArrowDown className="text-error h-4 w-4" />;
            }
          };

          // Format absolute change
          const daoIdKey = (daoId as string)?.toUpperCase() as DaoIdEnum;
          const decimals = daoConfigByDaoId[daoIdKey]?.decimals;
          const absoluteChangeNum = votingPowerVariation.absoluteChange
            ? Number(formatUnits(BigInt(votingPowerVariation.absoluteChange), decimals))
            : 0;
          const formattedAbsoluteChange = formatNumberUserReadable(
            absoluteChangeNum,
            1,
          );

          return (
            <div className="flex h-10 items-center justify-between gap-2 p-2">
              <span className="text-secondary whitespace-nowrap text-right text-sm">
                {formattedAbsoluteChange}
              </span>
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
                  {votingPowerVariation.percentageChange === PERCENTAGE_NO_BASELINE
                    ? ">1000%"
                    : `${Number(votingPowerVariation.percentageChange).toFixed(1)}%`}
                </span>
              </div>
            </div>
          );
        },
        header: () => (
          <div className="text-table-header flex h-8 w-full shrink-0 items-center justify-start whitespace-nowrap px-2">
            <Tooltip tooltipContent="Shows the voting power change within 30 days before voting starts">
              <p className="border-border-contrast hover:border-primary border-b border-dashed transition-colors duration-300">
                VP Change (Last 30d)
              </p>
            </Tooltip>
          </div>
        ),
      },
      {
        accessorKey: "transactionHash",
        size: 40,
        cell: ({ row }) => {
          const transactionHash = row.getValue("transactionHash") as string;

          // Handle skeleton data (empty objects from initial load)
          if (!transactionHash) {
            return (
              <div className="flex h-10 items-center justify-center p-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="size-3.5"
                />
              </div>
            );
          }

          const daoIdKey = (daoId as string)?.toUpperCase() as DaoIdEnum;
          const blockExplorerUrl =
            daoConfigByDaoId[daoIdKey]?.daoOverview?.chain?.blockExplorers
              ?.default?.url ?? "https://etherscan.io";

          return (
            <div className="flex h-10 items-center justify-center p-2">
              <Link
                href={`${blockExplorerUrl}/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-fit cursor-pointer items-center justify-center border border-transparent bg-transparent p-1 text-primary transition-colors duration-300 hover:bg-surface-contrast"
              >
                <ExternalLink className="size-3.5 shrink-0" />
              </Link>
            </div>
          );
        },
        header: () => (
          <div className="flex h-8 w-full items-center justify-center px-2" />
        ),
      },
    ],
    [proposal, handleSort, sortBy, sortDirection, daoId],
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
          voterAddress: `__DESCRIPTION_${vote.voterAddress}__`,
          transactionHash: "",
          proposalId: vote.proposalId,
          support: 0,
          votingPower: "",
          reason: vote.reason,
          timestamp: 0,
          isSubRow: true,
        } as VoteWithHistoricalPower);
      }
    });

    // Add loading row if there are more pages or currently loading
    if (hasNextPage || isLoadingMore) {
      data.push({
        voterAddress: "__LOADING_ROW__",
        transactionHash: "",
        proposalId: "",
        support: 0,
        votingPower: "",
        reason: "",
        timestamp: 0,
        isSubRow: false,
      } as VoteWithHistoricalPower);
    }

    return data;
  }, [votes, hasNextPage, isLoadingMore]);

  // Show skeleton table on initial load or when we have no valid data
  const hasValidData =
    votes.length > 0 &&
    votes.some(
      (vote) => vote.voterAddress && vote.voterAddress !== "__LOADING_ROW__",
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
      <VotesTable
        columns={columns}
        data={tableData}
        showWhenEmpty={
          <BlankSlate
            variant="default"
            icon={Inbox}
            description="No votes found"
          />
        }
      />
    </div>
  );
};
