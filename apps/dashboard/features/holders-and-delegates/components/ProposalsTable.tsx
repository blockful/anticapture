"use client";

import React, { useMemo } from "react";
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
import {
  ExternalLink,
  CheckCircle,
  XCircle,
  CircleMinus,
  ThumbsDown,
  Clock10,
  UserX,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useDaoData } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";

// Activity Indicator Component for Ongoing state
const ActivityIndicator = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center", className)}>
    <div className="border-warning size-4 animate-spin rounded-full border-2 border-t-transparent" />
  </div>
);

// Vote mapping object
const voteMapping = {
  0: {
    support: "0",
    text: "No",
    icon: <XCircle className="text-error size-4" />,
  },
  1: {
    support: "1",
    text: "Yes",
    icon: <CheckCircle className="text-success size-4" />,
  },
  2: {
    support: "2",
    text: "Abstain",
    icon: <CircleMinus className="text-secondary size-4" />,
  },
  "didnt-vote": {
    support: null,
    text: "Didn't vote",
    icon: <ThumbsDown className="text-secondary size-4" />,
  },
  waiting: {
    support: null,
    text: "Waiting",
    icon: <Clock10 className="text-secondary size-4" />,
  },
};

// Final result mapping object
const finalResultMapping = {
  ongoing: {
    text: "Ongoing",
    icon: <ActivityIndicator className="text-warning" />,
  },
  yes: {
    text: "Yes",
    icon: <CheckCircle className="text-success size-4" />,
  },
  no: {
    text: "No",
    icon: <XCircle className="text-error size-4" />,
  },
  cancel: {
    text: "Cancel",
    icon: <CircleMinus className="text-secondary size-4" />,
  },
  "no-quorum": {
    text: "No quorum",
    icon: <UserX className="text-secondary size-4" />,
  },
  unknown: {
    text: "Unknown",
    icon: <ThumbsDown className="text-secondary size-4" />,
  },
};

interface ProposalTableData {
  id: string;
  proposalName: string;
  finalResult: { text: string; icon: React.ReactNode };
  userVote: { text: string; icon: React.ReactNode };
  votingPower: string;
  voteTiming: { text: string; percentage: number };
  status: string;
}

interface ProposalsTableProps {
  proposals: any[];
  loading: boolean;
  error: Error | null;
}

// Helper function to extract proposal name from description
const extractProposalName = (description: string): string => {
  if (!description) return "Untitled Proposal";

  // Split by line breaks and get the first line
  const firstLine = description.split("\n")[0];

  // Remove markdown formatting (like # for headers)
  const cleanedTitle = firstLine.replace(/^#+\s*/, "").trim();

  return cleanedTitle || "Untitled Proposal";
};

// Helper function to get user vote data for TextIconLeft
const getUserVoteData = (
  support: number | null | undefined,
  proposalStatus: string | undefined,
): { text: string; icon: React.ReactNode } => {
  // If user voted
  if (support !== null && support !== undefined) {
    const voteData = voteMapping[support as keyof typeof voteMapping];
    if (voteData) {
      return { text: voteData.text, icon: voteData.icon };
    }
  }

  // If user didn't vote, check proposal status
  const status = proposalStatus?.toLowerCase();
  if (status === "active" || status === "pending") {
    return { text: voteMapping.waiting.text, icon: voteMapping.waiting.icon };
  }

  return {
    text: voteMapping["didnt-vote"].text,
    icon: voteMapping["didnt-vote"].icon,
  };
};

// Status to result mapping
const statusToResultMapping: Record<string, keyof typeof finalResultMapping> = {
  active: "ongoing",
  pending: "ongoing",
  executed: "yes",
  succeeded: "yes",
  defeated: "no",
  failed: "no",
  canceled: "cancel",
  cancelled: "cancel",
  "no-quorum": "no-quorum",
  noquorum: "no-quorum",
};

// Helper function to get final result data for TextIconLeft
const getFinalResultData = (
  proposal: any,
): { text: string; icon: React.ReactNode } => {
  if (!proposal) return finalResultMapping.unknown;

  const status = proposal.status?.toLowerCase();
  const resultKey = statusToResultMapping[status] || "unknown";
  return finalResultMapping[resultKey];
};

// Helper function to check if proposal is finished
const isProposalFinished = (proposalStatus: string | undefined): boolean => {
  const status = proposalStatus?.toLowerCase();
  return status !== "active" && status !== "pending";
};

// Helper function to format vote timing and calculate percentage
const getVoteTimingData = (
  userVote: any,
  proposal: any,
): { text: string; percentage: number } => {
  // If user didn't vote
  if (!userVote || !userVote.timestamp) {
    // Check if proposal is finished
    if (isProposalFinished(proposal?.status)) {
      return { text: "Didn't vote", percentage: 0 };
    }
    return { text: "Waiting", percentage: 0 };
  }

  if (!proposal || !proposal.startBlock || !proposal.endBlock) {
    return { text: "Early", percentage: 25 };
  }

  // Convert timestamps to numbers for calculation
  const voteTime = Number(userVote.timestamp);
  const startTime = Number(proposal.timestamp); // Proposal start time
  const duration = 30 * 24 * 60 * 60; // 30 days in seconds
  const endTime = startTime + duration;

  if (voteTime >= endTime) {
    return { text: "Expired", percentage: 100 };
  }

  // Calculate how much time has passed as a percentage
  const timeElapsed = voteTime - startTime;
  const percentage = Math.max(0, Math.min(100, (timeElapsed / duration) * 100));

  const timeDiff = endTime - voteTime;
  const daysLeft = Math.floor(timeDiff / (24 * 60 * 60));

  if (daysLeft <= 0) {
    return { text: "Late", percentage };
  } else if (daysLeft >= 10) {
    return { text: `Early (${daysLeft}d left)`, percentage };
  } else {
    return { text: `Late (${daysLeft}d left)`, percentage };
  }
};

export const ProposalsTable = ({
  proposals,
  loading,
  error,
}: ProposalsTableProps) => {
  // Get DAO data for token symbol
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const { data: daoData } = useDaoData(daoIdEnum);

  const tableData = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];

    return proposals.map(
      (item): ProposalTableData => ({
        id: item.proposal?.id || "",
        proposalName: extractProposalName(item.proposal?.description || ""),
        finalResult: getFinalResultData(item.proposal),
        userVote: getUserVoteData(
          item.userVote?.support,
          item.proposal?.status,
        ),
        votingPower: item.userVote?.votingPower
          ? formatNumberUserReadable(Number(item.userVote.votingPower) / 1e18)
          : "-",
        voteTiming: getVoteTimingData(item.userVote, item.proposal),
        status: item.proposal?.status || "unknown",
      }),
    );
  }, [proposals]);

  const proposalColumns: ColumnDef<ProposalTableData>[] = [
    {
      accessorKey: "proposalName",
      size: 220,
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
            <span className="text-primary truncate text-sm font-medium">
              {proposalName}
            </span>
          </div>
        );
      },
      header: () => <h4 className="text-table-header pl-4">Proposal Name</h4>,
    },
    {
      accessorKey: "finalResult",
      size: 112,
      cell: ({ row }) => {
        const finalResult = row.getValue("finalResult") as {
          text: string;
          icon: React.ReactNode;
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
          className="!text-table-header w-full justify-start px-2"
          onClick={() => column.toggleSorting()}
        >
          Final Result
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
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
      size: 112,
      cell: ({ row }) => {
        const userVote = row.getValue("userVote") as {
          text: string;
          icon: React.ReactNode;
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
          className="!text-table-header w-full justify-start px-2"
          onClick={() => column.toggleSorting()}
        >
          User Vote
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
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
      size: 112,
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
          className="flex w-full justify-end px-2"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header">Voting Power</h4>
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
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
      size: 172,
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
            <div className="text-secondary text-xs font-normal">
              {voteTiming.text}
            </div>
            <SimpleProgressBar percentage={voteTiming.percentage} />
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="flex w-full justify-start px-2"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header">Vote Timing</h4>
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
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
      accessorKey: "redirect",
      size: 38,
      cell: ({ row }) => {
        const proposalId = row.getValue("id") as string;

        if (loading) {
          return (
            <div className="flex h-10 items-center justify-center py-2 pr-0.5 pl-1">
              <SkeletonRow className="h-4 w-4" />
            </div>
          );
        }

        const handleRedirect = () => {
          if (proposalId) {
            // Open tally.xyz in new tab with the proposal ID
            window.open(
              `https://www.tally.xyz/gov/ens/proposal/${proposalId}`,
              "_blank",
            );
          }
        };

        return (
          <div className="flex h-10 items-center justify-center py-2 pr-0.5 pl-1">
            <button
              onClick={handleRedirect}
              className="hover:text-primary cursor-pointer text-white transition-colors"
              title="View on Tally"
            >
              <ExternalLink className="size-4" />
            </button>
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
          data={Array.from({ length: 5 }, (_, i) => ({
            id: `loading-${i}`,
            proposalName: "",
            finalResult: { text: "", icon: null },
            userVote: { text: "", icon: null },
            votingPower: "",
            voteTiming: { text: "", percentage: 0 },
            status: "",
            redirect: "",
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
      />
    </div>
  );
};
