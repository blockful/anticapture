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
import { AlertOctagon, ExternalLink, Inbox } from "lucide-react";
import { useDaoData } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { Query_ProposalsActivity_Proposals_Items } from "@anticapture/graphql-client";
import {
  FilterDropdown,
  FilterOption,
} from "@/shared/components/dropdowns/FilterDropdown";
import daoConfigByDaoId from "@/shared/dao-config";
import Link from "next/link";
import {
  getUserVoteData,
  extractProposalName,
  getVoteTimingData,
  proposalsFinalResultMapping,
} from "@/features/holders-and-delegates/utils/proposalsTableUtils";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import { Table } from "@/shared/components/design-system/table/Table";

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

  const tableData = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];

    return proposals.map((item): ProposalTableData => {
      const finalResult =
        proposalsFinalResultMapping[
          item.proposal.status as keyof typeof proposalsFinalResultMapping
        ];

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
          ? formatNumberUserReadable(Number(item.userVote.votingPower) / 1e18)
          : "-",
        voteTiming: getVoteTimingData(
          item.userVote,
          item.proposal,
          finalResult.text,
          Number(daoData?.votingPeriod) *
            daoConfigByDaoId[daoIdEnum]?.daoOverview.blockTime, //voting period comes in blocks, so we need to convert it to seconds
        ),
        status: item.proposal?.status || "unknown",
      };
    });
  }, [proposals, daoData?.votingPeriod, daoIdEnum]);

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
        <div className="flex items-center gap-2 font-medium">
          User Vote
          {userVoteFilterOptions && onUserVoteFilterChange && (
            <FilterDropdown
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
          <h4 className="text-table-header">Vote Timing</h4>
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

        return (
          <div className="flex items-center justify-center">
            <Link
              href={`${daoConfigByDaoId[daoIdEnum]?.daoOverview?.tally}/proposal/${proposalId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-secondary cursor-pointer text-white transition-colors"
              title="View on Tally"
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

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Table
          columns={proposalColumns}
          data={Array.from({ length: 12 }, (_, i) => ({
            proposalId: `loading-${i}`,
            proposalName: "",
            finalResult: { text: "", icon: null },
            userVote: { text: "", icon: null },
            votingPower: "",
            voteTiming: { text: "", percentage: 0 },
            status: "",
          }))}
          withDownloadCSV={true}
          size="sm"
          wrapperClassName="h-[450px]"
          className="h-[400px]"
        />
      </div>
    );
  }

  if (error) {
    return (
      <BlankSlate
        variant="default"
        icon={AlertOctagon}
        title="FAILED TO LOAD API DEFINITION"
        description="Please check your network connection and refresh the page."
      />
    );
  }

  if (!proposals || (proposals.length === 0 && userVoteFilter === "all")) {
    return (
      <BlankSlate
        variant="default"
        icon={Inbox}
        title=""
        description="No voted proposals to show"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Table
        columns={proposalColumns}
        data={tableData}
        size="sm"
        hasMore={pagination.hasNextPage}
        isLoadingMore={fetchingMore}
        onLoadMore={fetchNextPage}
        withDownloadCSV={true}
        wrapperClassName="h-[450px]"
        className="h-[400px]"
      />
    </div>
  );
};
