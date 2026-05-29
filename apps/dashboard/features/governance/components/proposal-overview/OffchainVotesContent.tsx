"use client";

import {
  getNextPageParam,
  type OffchainVote,
  type OrderDirection,
  type VotesOffchainByProposalIdPathParamsDaoEnumKey,
  type VotesOffchainByProposalIdQueryParamsOrderByEnumKey,
} from "@anticapture/client";
import { useVotesOffchainByProposalIdInfinite } from "@anticapture/client/hooks";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, CircleMinus, Inbox, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Address } from "viem";

import { OffchainVoteLabelChip } from "@/features/governance/components/proposal-overview/OffchainVoteLabelChip";
import { VotesTable } from "@/features/governance/components/proposal-overview/VotesTable";
import { getOffchainVoteFullLabel } from "@/features/governance/utils/offchainVoteLabel";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";

const LOADING_ROW = "__LOADING_ROW__";

// Table rows include synthetic sentinel rows (loading + description sub-rows)
// whose `voter` is not a real address, so widen it from the strict `Address`.
type OffchainVoteRow = Omit<
  OffchainVote,
  "voter" | "proposalId" | "proposalTitle"
> & {
  voter: string;
  isSubRow?: boolean;
};

const getLabelDisplay = (label: string) => {
  const lower = label.toLowerCase();
  if (lower === "for")
    return { label, icon: <CheckCircle2 className="text-success size-4" /> };
  if (lower === "against")
    return { label, icon: <XCircle className="text-error size-4" /> };
  if (lower === "abstain")
    return { label, icon: <CircleMinus className="text-secondary size-4" /> };
  return { label, icon: null as React.ReactNode };
};

const getChoiceInfo = (choice: string[], choices: string[]) => {
  if (choice.length === 0) return { label: "—", icon: null as React.ReactNode };

  const fullLabel = getOffchainVoteFullLabel(choice, choices);
  if (!fullLabel) return { label: "—", icon: null as React.ReactNode };

  if (choice.length === 1 && choice[0] != null) {
    return getLabelDisplay(fullLabel);
  }

  return { label: fullLabel, icon: null as React.ReactNode };
};

interface OffchainVotesContentProps {
  proposalId: string;
  daoId: DaoIdEnum;
  totalVotingPower: number;
  choices: string[];
  proposalType?: string | null;
}

export const OffchainVotesContent = ({
  proposalId,
  daoId,
  totalVotingPower,
  choices,
  proposalType,
}: OffchainVotesContentProps) => {
  const loadingRowRef = useRef<HTMLTableRowElement>(null);

  const [orderBy, setOrderBy] =
    useState<VotesOffchainByProposalIdQueryParamsOrderByEnumKey>("timestamp");
  const [orderDirection, setOrderDirection] = useState<OrderDirection>("desc");

  const handleSort = useCallback(
    (field: VotesOffchainByProposalIdQueryParamsOrderByEnumKey) => {
      if (orderBy === field) {
        setOrderDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setOrderBy(field);
        setOrderDirection("desc");
      }
    },
    [orderBy],
  );

  const {
    data,
    isLoading: loading,
    error,
    fetchNextPage,
    hasNextPage,
  } = useVotesOffchainByProposalIdInfinite(
    daoId.toLowerCase() as VotesOffchainByProposalIdPathParamsDaoEnumKey,
    proposalId,
    { limit: 10, orderBy, orderDirection },
    { query: { enabled: !!proposalId, getNextPageParam } },
  );

  const votes = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const loadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !loading) loadMore();
      },
      { threshold: 0.1 },
    );
    if (loadingRowRef.current) observer.observe(loadingRowRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, loading, loadMore]);

  const tableData = useMemo(() => {
    const rows: OffchainVoteRow[] = [];

    votes.forEach((vote) => {
      rows.push(vote);
      if (vote.reason && vote.reason.trim() !== "") {
        rows.push({
          voter: `__DESCRIPTION_${vote.voter}__`,
          choice: [],
          vp: null,
          reason: vote.reason,
          created: 0,
          isSubRow: true,
        });
      }
    });

    if (hasNextPage || (loading && votes.length > 0)) {
      rows.push({
        voter: LOADING_ROW,
        choice: [],
        vp: null,
        reason: "",
        created: 0,
      });
    }

    return rows;
  }, [votes, hasNextPage, loading]);

  const columns: ColumnDef<OffchainVoteRow>[] = useMemo(
    () => [
      {
        accessorKey: "voter",
        size: 200,
        header: () => (
          <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
            <p>Voter</p>
          </div>
        ),
        cell: ({ row }) => {
          const voter = row.getValue("voter") as string;

          if (voter === LOADING_ROW) {
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

          if (!voter) {
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
            <div className="flex h-10 items-center p-2">
              <EnsAvatar
                address={voter as Address}
                size="sm"
                variant="rounded"
                showName={true}
                isDashed={true}
              />{" "}
              <CopyAndPasteButton
                textToCopy={voter}
                className="text-secondary hover:text-primary ml-2 inline-flex p-1 align-middle transition-colors"
                iconSize="md"
              />
            </div>
          );
        },
      },
      {
        accessorKey: "choice",
        size: 120,
        header: () => (
          <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
            <p>Choice</p>
          </div>
        ),
        cell: ({ row }) => {
          const voter = row.getValue("voter") as string;
          if (voter === LOADING_ROW || !voter) {
            return (
              <div className="flex items-center gap-2 p-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-6 w-16"
                />
              </div>
            );
          }
          const choice = row.getValue("choice") as string[];
          const choiceInfo = getChoiceInfo(choice, choices);
          const { icon, label } = choiceInfo;
          const isMultiChoice = choice.length > 1;
          return (
            <div className="flex min-w-0 items-center gap-2 p-2">
              {icon}
              {isMultiChoice ? (
                <OffchainVoteLabelChip
                  label={label}
                  proposalType={proposalType}
                  variant="inline"
                />
              ) : (
                <span className="text-sm font-medium">{label}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "created",
        size: 120,
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
                orderBy === "timestamp"
                  ? orderDirection === "asc"
                    ? ArrowState.UP
                    : ArrowState.DOWN
                  : ArrowState.DEFAULT
              }
            />
          </Button>
        ),
        cell: ({ row }) => {
          const voter = row.getValue("voter") as string;
          if (voter === LOADING_ROW || !voter) {
            return (
              <div className="flex h-10 items-center p-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-4 w-20"
                />
              </div>
            );
          }
          const created = row.getValue("created") as number;
          const date = new Date(created * 1000);
          const formattedDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const formattedTime = date
            .toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
            .toLowerCase();
          return (
            <div className="flex h-10 flex-col items-start justify-center p-2">
              <span className="text-secondary whitespace-nowrap text-sm leading-5">
                {formattedDate}
              </span>
              <span className="text-secondary text-xs leading-[18px]">
                {formattedTime}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "vp",
        size: 160,
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            className="text-secondary w-full justify-start"
            onClick={() => handleSort("votingPower")}
          >
            <h4 className="text-table-header whitespace-nowrap">
              Voting Power
            </h4>
            <ArrowUpDown
              props={{ className: "size-4 ml-1" }}
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
        cell: ({ row }) => {
          const voter = row.getValue("voter") as string;
          if (voter === LOADING_ROW || !voter) {
            return (
              <div className="flex h-10 items-center p-2">
                <SkeletonRow
                  parentClassName="flex animate-pulse"
                  className="h-4 w-24"
                />
              </div>
            );
          }
          const vp = row.getValue("vp") as number | null;
          const vpNum = vp ?? 0;
          const percentage =
            totalVotingPower > 0
              ? ((vpNum / totalVotingPower) * 100).toFixed(1)
              : "0.0";
          return (
            <div className="flex h-10 items-center p-2">
              <span className="text-primary text-sm font-medium">
                {formatNumberUserReadable(vpNum)} ({percentage}%)
              </span>
            </div>
          );
        },
      },
    ],
    [
      totalVotingPower,
      choices,
      proposalType,
      orderBy,
      orderDirection,
      handleSort,
    ],
  );

  if (error)
    return (
      <div>
        Error: {error instanceof Error ? error.message : "Failed to load votes"}
      </div>
    );

  if (loading && votes.length === 0) {
    return (
      <div className="w-full lg:p-4">
        <VotesTable
          columns={columns}
          data={Array.from({ length: 7 }, () => ({}) as OffchainVoteRow)}
        />
      </div>
    );
  }

  return (
    <div className="w-full lg:p-4">
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
