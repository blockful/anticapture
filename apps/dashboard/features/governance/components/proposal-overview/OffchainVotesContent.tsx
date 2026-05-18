"use client";

import {
  orderDirectionEnum,
  type OffchainVote,
  type VotesOffchainByProposalIdQueryParamsOrderByEnumKey,
  votesOffchainByProposalIdQueryParamsOrderByEnum,
} from "@anticapture/client";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, CircleMinus, Inbox, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Address } from "viem";

import { VotesTable } from "@/features/governance/components/proposal-overview/VotesTable";
import { useOffchainVotes } from "@/features/governance/hooks/useOffchainVotes";
import { useOffchainVotesParams } from "@/features/governance/hooks/useOffchainVotesParams";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

const LOADING_ROW = "__LOADING_ROW__";

type OffchainVoteTableRow = Omit<
  OffchainVote,
  "voter" | "choice" | "proposalId" | "proposalTitle"
> &
  Partial<Pick<OffchainVote, "proposalId" | "proposalTitle">> & {
    voter: string;
    choice?: string[];
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
  if (choice.length === 0) return { label: "-", icon: null as React.ReactNode };

  if (choice.length === 1 && choice[0] != null) {
    const idx = Number(choice[0]);
    const label = choices[idx - 1] ?? `Choice ${choice[0]}`;
    return getLabelDisplay(label);
  }

  const label = choice
    .filter((c): c is string => c != null)
    .map((c) => {
      const idx = Number(c);
      return choices[idx - 1] ?? `Choice ${c}`;
    })
    .join(", ");
  return { label, icon: null as React.ReactNode };
};

interface OffchainVotesContentProps {
  proposalId: string;
  daoId: DaoIdEnum;
  totalVotingPower: number;
  choices: string[];
}

export const OffchainVotesContent = ({
  proposalId,
  daoId,
  totalVotingPower,
  choices,
}: OffchainVotesContentProps) => {
  const loadingRowRef = useRef<HTMLTableRowElement>(null);
  const { filters, setFilters } = useOffchainVotesParams();
  const { orderBy, orderDirection } = filters;

  const handleSort = useCallback(
    (field: VotesOffchainByProposalIdQueryParamsOrderByEnumKey) => {
      if (orderBy === field) {
        setFilters({
          ...filters,
          orderDirection:
            orderDirection === orderDirectionEnum.asc
              ? orderDirectionEnum.desc
              : orderDirectionEnum.asc,
        });
        return;
      }

      setFilters({
        ...filters,
        orderBy: field,
        orderDirection: orderDirectionEnum.desc,
      });
    },
    [filters, orderBy, orderDirection, setFilters],
  );

  const {
    data: votes,
    isLoading,
    isFetchingNextPage,
    error,
    fetchNextPage,
    hasNextPage,
  } = useOffchainVotes({
    daoId,
    proposalId,
    limit: 10,
    orderBy,
    orderDirection,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px", threshold: 0.1 },
    );
    if (loadingRowRef.current) observer.observe(loadingRowRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const tableData = useMemo(() => {
    const rows: OffchainVoteTableRow[] = [];

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

    if (hasNextPage || (isFetchingNextPage && votes.length > 0)) {
      rows.push({
        voter: LOADING_ROW,
        choice: [],
        vp: null,
        reason: "",
        created: 0,
      });
    }

    return rows;
  }, [votes, hasNextPage, isFetchingNextPage]);

  const columns: ColumnDef<OffchainVoteTableRow>[] = useMemo(
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
          const choice = (row.getValue("choice") as string[] | undefined) ?? [];
          const { icon, label } = getChoiceInfo(choice, choices);
          return (
            <div className="flex items-center gap-2 p-2">
              {icon}
              <span className="text-sm font-medium">{label}</span>
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
            onClick={() =>
              handleSort(
                votesOffchainByProposalIdQueryParamsOrderByEnum.timestamp,
              )
            }
          >
            <h4 className="text-table-header whitespace-nowrap">Date</h4>
            <ArrowUpDown
              props={{ className: "size-4 ml-1" }}
              activeState={
                orderBy ===
                votesOffchainByProposalIdQueryParamsOrderByEnum.timestamp
                  ? orderDirection === orderDirectionEnum.asc
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
            onClick={() =>
              handleSort(
                votesOffchainByProposalIdQueryParamsOrderByEnum.votingPower,
              )
            }
          >
            <h4 className="text-table-header whitespace-nowrap">
              Voting Power
            </h4>
            <ArrowUpDown
              props={{ className: "size-4 ml-1" }}
              activeState={
                orderBy ===
                votesOffchainByProposalIdQueryParamsOrderByEnum.votingPower
                  ? orderDirection === orderDirectionEnum.asc
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
    [totalVotingPower, choices, orderBy, orderDirection, handleSort],
  );

  if (error) return <div>Error: {error.message}</div>;

  if (isLoading && votes.length === 0) {
    return (
      <div className="w-full lg:p-4">
        <VotesTable
          columns={columns}
          data={Array.from(
            { length: 7 },
            () =>
              ({
                voter: "",
                vp: null,
                reason: "",
                created: 0,
              }) satisfies OffchainVoteTableRow,
          )}
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
