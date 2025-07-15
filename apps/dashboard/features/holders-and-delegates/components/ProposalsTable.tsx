"use client";

import { ReactNode, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  TheTable,
  SkeletonRow,
  TextIconLeft,
  SimpleProgressBar,
} from "@/shared/components";
import { Button } from "@/shared/components/ui/button";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { formatNumberUserReadable, cn } from "@/shared/utils";
import { ExternalLink } from "lucide-react";
import { useParams } from "next/navigation";
import { useDaoData, useScreenSize } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { Query_ProposalsActivity_Proposals_Items } from "@anticapture/graphql-client";
import { ETHEREUM_BLOCK_TIME_SECONDS } from "@/shared/types/blockchains";
import daoConfigByDaoId from "@/shared/dao-config";
import Link from "next/link";
import {
  getFinalResultData,
  getUserVoteData,
  extractProposalName,
  getVoteTimingData,
} from "../utils/proposalsTableUtils";

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
  daoIdEnum: DaoIdEnum;
}

export const ProposalsTable = ({
  proposals,
  loading,
  error,
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
  }, [proposals, daoData?.votingPeriod, daoData?.quorum]);

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
      header: () => <h4 className="text-table-header pl-4">Proposal Name</h4>,
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="!text-table-header font-regular h-8 w-full justify-start gap-1 px-2 text-xs"
          onClick={() => column.toggleSorting()}
        >
          Final Result
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              column.getIsSorted() === "asc"
                ? ArrowState.UP
                : column.getIsSorted() === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: true,
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="!text-table-header h-8 w-full justify-start gap-1 px-2 text-xs"
          onClick={() => column.toggleSorting()}
        >
          User Vote
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              column.getIsSorted() === "asc"
                ? ArrowState.UP
                : column.getIsSorted() === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="flex h-8 w-full justify-end gap-1 px-2 text-xs"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header">Voting Power</h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              column.getIsSorted() === "asc"
                ? ArrowState.UP
                : column.getIsSorted() === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const a = parseFloat(rowA.getValue("votingPower") as string) || 0;
        const b = parseFloat(rowB.getValue("votingPower") as string) || 0;
        return a - b;
      },
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="flex h-8 w-full justify-start gap-1 px-2"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header">Vote Timing</h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              column.getIsSorted() === "asc"
                ? ArrowState.UP
                : column.getIsSorted() === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "proposalId",
      size: 38,
      cell: ({ row }) => {
        const proposalId = row.getValue("proposalId") as string;
        if (loading) {
          return (
            <div className="flex h-10 items-center justify-center py-2 pr-0.5 pl-1">
              <SkeletonRow className="h-4 w-4" />
            </div>
          );
        }

        return (
          <div className="flex h-10 items-center justify-center py-2 pr-0.5 pl-1">
            <Link
              href={`${daoConfigByDaoId[daoIdEnum]?.daoOverview?.tally}/proposal/${proposalId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-secondary cursor-pointer text-white transition-colors"
              title="View on Tally"
            >
              <ExternalLink className="size-4" />
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
          withPagination={false}
          withSorting={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-error">
          Error loading proposals: {error.message}
        </div>
      </div>
    );
  }

  if (!proposals || proposals.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-secondary">
          No proposals found for this delegate.
        </div>
      </div>
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
        isTableSmall={isMobile}
      />
    </div>
  );
};
