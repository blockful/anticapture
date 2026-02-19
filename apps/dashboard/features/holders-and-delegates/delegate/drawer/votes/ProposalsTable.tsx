"use client";

import { ReactNode, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  SkeletonRow,
  TextIconLeft,
  SimpleProgressBar,
  Button,
  IconButton,
} from "@/shared/components";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { formatNumberUserReadable, cn } from "@/shared/utils";
import { ExternalLink } from "lucide-react";
import { useDaoData } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { Query_ProposalsActivity_Proposals_Items } from "@anticapture/graphql-client";
import {
  CategoriesFilter,
  FilterOption,
} from "@/shared/components/design-system/table/filters/CategoriesFilter";
import daoConfigByDaoId from "@/shared/dao-config";
import Link from "next/link";
import {
  getUserVoteData,
  extractProposalName,
  getVoteTimingData,
  proposalsFinalResultMapping,
} from "@/features/holders-and-delegates/utils/proposalsTableUtils";
import { Table } from "@/shared/components/design-system/table/Table";
import daoConfig from "@/shared/dao-config";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { DEFAULT_ITEMS_PER_PAGE } from "@/features/holders-and-delegates/utils";
interface ProposalTableData {
  proposalId: string;
  proposalName: string;
  finalResult: { text: string; icon: ReactNode };
  userVote: { text: string; icon: ReactNode };
  votingPower: string;
  voteTiming: { text: string; percentage: number };
  status: string;
}

interface ProposalsTableProps {
  proposals: Query_ProposalsActivity_Proposals_Items[];
  loading: boolean;
  error: Error | null;
  userVoteFilter?: string;
  onUserVoteFilterChange?: (filter: string) => void;
  userVoteFilterOptions?: FilterOption[];
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  onSortChange?: (field: string, direction: "asc" | "desc") => void;
  daoIdEnum: DaoIdEnum;
  pagination: { hasNextPage: boolean; totalPages: number; currentPage: number };
  fetchingMore: boolean;
  fetchNextPage: () => void;
}

export const ProposalsTable = ({
  proposals,
  loading,
  error,
  userVoteFilter,
  onUserVoteFilterChange,
  userVoteFilterOptions,
  orderBy,
  orderDirection,
  onSortChange,
  daoIdEnum,
  pagination,
  fetchingMore,
  fetchNextPage,
}: ProposalsTableProps) => {
  const { data: daoData } = useDaoData(daoIdEnum);
  const {
    daoOverview: { token },
  } = daoConfig[daoIdEnum];

  const tableData = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];

    return proposals.map((item): ProposalTableData => {
      const finalResult =
        proposalsFinalResultMapping[
          item.proposal.status as keyof typeof proposalsFinalResultMapping
        ] ?? proposalsFinalResultMapping.unknown;

      const userVote = getUserVoteData(
        item.userVote?.support,
        finalResult.text,
      );
      return {
        proposalId: item.proposal?.id || "",
        proposalName: extractProposalName(item.proposal?.description || ""),
        finalResult,
        userVote,
        votingPower: item.userVote?.votingPower
          ? formatNumberUserReadable(
              token === "ERC20"
                ? Number(item.userVote.votingPower) / 1e18
                : Number(item.userVote.votingPower),
            )
          : "-",
        voteTiming: getVoteTimingData(
          item.userVote,
          item.proposal,
          finalResult.text,
          // dao data come in blocks, we then convert it to seconds
          (Number(daoData?.votingPeriod) *
            daoConfigByDaoId[daoIdEnum]?.daoOverview.chain.blockTime) /
            1000,
          daoData?.votingDelay
            ? (Number(daoData?.votingDelay) *
                daoConfigByDaoId[daoIdEnum]?.daoOverview.chain.blockTime) /
                1000
            : 0,
        ),
        status: item.proposal?.status || "unknown",
      };
    });
  }, [proposals, daoData, daoIdEnum, token]);

  const proposalColumns: ColumnDef<ProposalTableData>[] = [
    {
      accessorKey: "proposalName",
      meta: {
        columnClassName: "w-32",
      },
      cell: ({ row }) => {
        const proposalName = row.getValue("proposalName") as string;

        if (loading) {
          return (
            <div className="flex items-center">
              <SkeletonRow className="h-5 w-48" />
            </div>
          );
        }

        return (
          <div className="flex items-center">
            <span className="text-primary font-regular max-w-48 truncate text-sm">
              {proposalName}
            </span>
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-start p-0"
          onClick={() => {
            if (onSortChange) {
              const newDirection =
                orderBy === "timestamp" && orderDirection === "desc"
                  ? "asc"
                  : "desc";
              onSortChange("timestamp", newDirection);
            }
          }}
        >
          <h4 className="text-table-header">Proposal Name</h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              orderBy === "timestamp"
                ? orderDirection === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
                : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
    },
    {
      accessorKey: "finalResult",
      meta: {
        columnClassName: "w-28",
      },
      cell: ({ row }) => {
        const finalResult = row.getValue("finalResult") as {
          text: string;
          icon: ReactNode;
        };

        if (loading) {
          return (
            <div className="flex items-center justify-start">
              <SkeletonRow className="h-5 w-16" />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-start">
            <TextIconLeft text={finalResult.text} icon={finalResult.icon} />
          </div>
        );
      },
      header: () => <h4 className="text-table-header">Final Result</h4>,
    },
    {
      accessorKey: "userVote",
      meta: {
        columnClassName: "w-28",
      },
      cell: ({ row }) => {
        const userVote = row.getValue("userVote") as {
          text: string;
          icon: ReactNode;
        };

        if (loading) {
          return (
            <div className="flex items-center justify-start">
              <SkeletonRow className="h-5 w-16" />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-start">
            <TextIconLeft text={userVote.text} icon={userVote.icon} />
          </div>
        );
      },
      header: () => (
        <div className="flex items-center gap-2 whitespace-nowrap font-medium">
          User Vote
          {userVoteFilterOptions && onUserVoteFilterChange && (
            <CategoriesFilter
              options={userVoteFilterOptions}
              selectedValue={userVoteFilter || "all"}
              onValueChange={onUserVoteFilterChange}
            />
          )}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "votingPower",
      meta: {
        columnClassName: "min-w-32",
      },
      cell: ({ row }) => {
        const votingPower = row.getValue("votingPower") as string;

        if (loading) {
          return (
            <div className="flex items-center justify-end">
              <SkeletonRow className="h-5 w-16" />
            </div>
          );
        }

        return (
          <div className="text-secondary flex items-center justify-end text-sm font-normal">
            {votingPower === "-"
              ? "-"
              : `${votingPower} ${daoData?.id || "ENS"}`}
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-end p-0"
          onClick={() => {
            if (onSortChange) {
              const newDirection =
                orderBy === "votingPower" && orderDirection === "desc"
                  ? "asc"
                  : "desc";
              onSortChange("votingPower", newDirection);
            }
          }}
        >
          <h4 className="text-table-header">Voting Power</h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              orderBy === "votingPower"
                ? orderDirection === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
                : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
    },
    {
      accessorKey: "voteTiming",
      meta: {
        columnClassName: "min-w-40",
      },
      cell: ({ row }) => {
        const voteTiming = row.getValue("voteTiming") as {
          text: string;
          percentage: number;
        };

        if (loading) {
          return (
            <div className="flex items-center justify-start">
              <SkeletonRow className="h-5 w-20" />
            </div>
          );
        }

        return (
          <div className="flex flex-col justify-center gap-1">
            <div
              className={cn("text-secondary text-xs font-normal", {
                "text-end text-sm": voteTiming.text === "-",
              })}
            >
              {voteTiming.text}
            </div>
            {voteTiming.text !== "-" && (
              <SimpleProgressBar percentage={voteTiming.percentage} />
            )}
          </div>
        );
      },
      header: () => (
        <div className="flex items-center gap-1.5">
          <Tooltip tooltipContent="Measures how close to the proposal deadline a vote is cast. Delegates who vote late may be influenced by prior votes or ongoing discussion.">
            <Button
              variant="ghost"
              size="sm"
              className="text-secondary w-full justify-start p-0"
              onClick={() => {
                if (onSortChange) {
                  const newDirection =
                    orderBy === "voteTiming" && orderDirection === "desc"
                      ? "asc"
                      : "desc";
                  onSortChange("voteTiming", newDirection);
                }
              }}
            >
              <h4 className="text-table-header decoration-secondary/20 group-hover:decoration-primary hover:decoration-primary underline decoration-dashed underline-offset-[6px] transition-colors duration-300">
                Vote Timing
              </h4>
              <ArrowUpDown
                props={{ className: "size-4" }}
                activeState={
                  orderBy === "voteTiming"
                    ? orderDirection === "asc"
                      ? ArrowState.UP
                      : ArrowState.DOWN
                    : ArrowState.DEFAULT
                }
              />
            </Button>
          </Tooltip>
        </div>
      ),
    },
    {
      accessorKey: "proposalId",
      meta: {
        columnClassName: "w-10",
      },
      cell: ({ row }) => {
        const proposalId = row.getValue("proposalId") as string;
        if (loading) {
          return (
            <div className="flex items-center justify-center">
              <SkeletonRow className="h-4 w-4" />
            </div>
          );
        }

        const govPlatformUrl =
          daoConfigByDaoId[daoIdEnum]?.daoOverview?.govPlatform?.url;
        const govPlatformName =
          daoConfigByDaoId[daoIdEnum]?.daoOverview?.govPlatform?.name;

        if (!govPlatformUrl) {
          return null;
        }

        return (
          <div className="flex items-center justify-center">
            <Link
              href={`${govPlatformUrl}${proposalId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-secondary cursor-pointer text-white transition-colors"
              title={`View on ${govPlatformName}`}
            >
              <IconButton variant="ghost" icon={ExternalLink} />
            </Link>
          </div>
        );
      },
      header: () => <div className="w-full"></div>, // Empty header
      enableSorting: false,
    },
  ];

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
      <Table
        columns={proposalColumns}
        data={loading ? Array(DEFAULT_ITEMS_PER_PAGE).fill({}) : tableData}
        size="sm"
        hasMore={pagination.hasNextPage}
        isLoadingMore={fetchingMore}
        onLoadMore={fetchNextPage}
        withDownloadCSV={true}
        error={error}
        fillHeight
      />
    </div>
  );
};
