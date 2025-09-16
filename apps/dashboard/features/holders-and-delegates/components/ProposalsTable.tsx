"use client";

import { ReactNode, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  TheTable,
  SkeletonRow,
  TextIconLeft,
  SimpleProgressBar,
  Button,
  IconButton,
} from "@/shared/components";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { formatNumberUserReadable, cn } from "@/shared/utils";
import { AlertOctagon, ExternalLink, Inbox } from "lucide-react";
import { useDaoData, useScreenSize } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { Query_ProposalsActivity_Proposals_Items } from "@anticapture/graphql-client";
import { ETHEREUM_BLOCK_TIME_SECONDS } from "@/shared/types/blockchains";
import {
  FilterDropdown,
  FilterOption,
} from "@/shared/components/dropdowns/FilterDropdown";
import daoConfigByDaoId from "@/shared/dao-config";
import Link from "next/link";
import {
  getFinalResultData,
  getUserVoteData,
  extractProposalName,
  getVoteTimingData,
} from "@/features/holders-and-delegates/utils/proposalsTableUtils";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";

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
}: ProposalsTableProps) => {
  const { data: daoData } = useDaoData(daoIdEnum);
  const { isMobile } = useScreenSize();

  const tableData = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];

    return proposals.map((item): ProposalTableData => {
      const finalResult = getFinalResultData(
        item.proposal,
        Number(daoData?.votingPeriod) * ETHEREUM_BLOCK_TIME_SECONDS, //voting period comes in blocks, so we need to convert it to seconds
        daoData?.quorum,
        daoConfigByDaoId[daoIdEnum], // Pass the DAO config to use quorum logic
      );
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
          Number(daoData?.votingPeriod) * ETHEREUM_BLOCK_TIME_SECONDS, //voting period comes in blocks, so we need to convert it to seconds
        ),
        status: item.proposal?.status || "unknown",
      };
    });
  }, [proposals, daoData?.votingPeriod, daoData?.quorum, daoIdEnum]);

  const proposalColumns: ColumnDef<ProposalTableData>[] = [
    {
      accessorKey: "proposalName",
      size: isMobile ? 160 : 220,
      cell: ({ row }) => {
        const proposalName = row.getValue("proposalName") as string;

        if (loading) {
          return (
            <div className="flex h-10 items-center px-4 py-2">
              <SkeletonRow className="h-5 w-48" />
            </div>
          );
        }

        return (
          <div className="flex h-10 items-center px-4 py-2">
            <span className="text-primary font-regular truncate text-sm">
              {proposalName}
            </span>
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-start"
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
      size: 118,
      cell: ({ row }) => {
        const finalResult = row.getValue("finalResult") as {
          text: string;
          icon: ReactNode;
        };

        if (loading) {
          return (
            <div className="flex h-10 items-center justify-start px-2 py-2">
              <SkeletonRow className="h-5 w-16" />
            </div>
          );
        }

        return (
          <div className="flex h-10 items-center justify-start px-2 py-2">
            <TextIconLeft text={finalResult.text} icon={finalResult.icon} />
          </div>
        );
      },
      header: () => <h4 className="text-table-header pl-4">Final Result</h4>,
    },
    {
      accessorKey: "userVote",
      size: 118,
      cell: ({ row }) => {
        const userVote = row.getValue("userVote") as {
          text: string;
          icon: ReactNode;
        };

        if (loading) {
          return (
            <div className="flex h-10 items-center justify-start px-2 py-2">
              <SkeletonRow className="h-5 w-16" />
            </div>
          );
        }

        return (
          <div className="flex h-10 items-center justify-start px-2 py-2">
            <TextIconLeft text={userVote.text} icon={userVote.icon} />
          </div>
        );
      },
      header: () => (
        <div className="flex items-center gap-2 px-2 font-medium">
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
      size: 118,
      cell: ({ row }) => {
        const votingPower = row.getValue("votingPower") as string;

        if (loading) {
          return (
            <div className="flex h-10 items-center justify-end px-2 py-2">
              <SkeletonRow className="h-5 w-16" />
            </div>
          );
        }

        return (
          <div className="text-secondary flex h-10 items-center justify-end px-2 py-2 text-sm font-normal">
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
          className="text-secondary w-full justify-end"
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
      size: 154,
      cell: ({ row }) => {
        const voteTiming = row.getValue("voteTiming") as {
          text: string;
          percentage: number;
        };

        if (loading) {
          return (
            <div className="flex h-10 items-center justify-start px-2 py-2">
              <SkeletonRow className="h-5 w-20" />
            </div>
          );
        }

        return (
          <div className="flex h-10 flex-col justify-center gap-1 px-2 py-2">
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
          className="text-secondary w-full justify-start"
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
      size: 38,
      cell: ({ row }) => {
        const proposalId = row.getValue("proposalId") as string;
        if (loading) {
          return (
            <div className="flex h-10 items-center justify-center py-2 pl-1 pr-0.5">
              <SkeletonRow className="h-4 w-4" />
            </div>
          );
        }

        return (
          <div className="flex h-10 items-center justify-center py-2 pl-1 pr-0.5">
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
        <TheTable
          columns={proposalColumns}
          data={Array.from({ length: 10 }, (_, i) => ({
            proposalId: `loading-${i}`,
            proposalName: "",
            finalResult: { text: "", icon: null },
            userVote: { text: "", icon: null },
            votingPower: "",
            voteTiming: { text: "", percentage: 0 },
            status: "",
          }))}
          isTableSmall={true}
          withPagination={false}
          withSorting={true}
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
      <TheTable
        columns={proposalColumns}
        data={tableData}
        withPagination={false}
        withSorting={true}
        stickyFirstColumn={true}
        mobileTableFixed={true}
        isTableSmall={true}
        showWhenEmpty={
          <BlankSlate
            variant="default"
            icon={Inbox}
            title=""
            className="h-full rounded-none"
            description="No voted proposals to show"
          />
        }
      />
    </div>
  );
};
