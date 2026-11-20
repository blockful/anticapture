"use client";

import { getNextPageParam } from "@anticapture/client";
import type { VotesOffchainPathParamsDaoEnumKey } from "@anticapture/client";
import { useVotesOffchainInfinite } from "@anticapture/client/hooks";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { Address } from "viem";

import { getOffchainVoteFullLabel } from "@/features/governance/utils/offchainVoteLabel";
import { VoteReason } from "@/features/holders-and-delegates/profile/components/VoteReason";
import { useSnapshotProposalsById } from "@/features/holders-and-delegates/profile/hooks/useSnapshotParticipation";
import { EmptyState } from "@/shared/components/design-system/table/components/EmptyState";
import { Table } from "@/shared/components/design-system/table/Table";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";
import { formatDateUserReadable } from "@/shared/utils/formatDateUserReadable";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";
import { getDaoProposalPath } from "@/shared/utils/whitelabel";

const PAGE_SIZE = 20;

type SnapshotVoteRow = {
  proposalId: string;
  proposalTitle: string;
  choice: string;
  votingPower: number | null;
  votedAt: number;
  reason: string | null;
};

const CHOICE_TONE: Record<string, string> = {
  for: "text-success",
  against: "text-error",
  abstain: "text-secondary",
};

/** Every Snapshot vote the address cast in this DAO, newest first. */
export const SnapshotVotesTable = ({
  daoId,
  address,
}: {
  daoId: DaoIdEnum;
  address: Address;
}) => {
  const pathname = usePathname();
  const { proposalsById } = useSnapshotProposalsById(daoId);
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useVotesOffchainInfinite(
    daoId.toLowerCase() as VotesOffchainPathParamsDaoEnumKey,
    { voterAddresses: [address], limit: PAGE_SIZE, orderDirection: "desc" },
    { query: { getNextPageParam } },
  );

  const rows = useMemo<SnapshotVoteRow[]>(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.items)
        .map((vote) => {
          const proposal = proposalsById.get(vote.proposalId);
          return {
            proposalId: vote.proposalId,
            proposalTitle:
              vote.proposalTitle ?? proposal?.title ?? vote.proposalId,
            // Choices are 1-based indexes into the proposal's options; without
            // the proposal at hand they still read as "Choice N".
            choice:
              getOffchainVoteFullLabel(
                vote.choice ?? [],
                proposal?.choices ?? [],
              ) || "-",
            votingPower: vote.vp,
            votedAt: vote.created,
            reason: vote.reason?.trim() || null,
          };
        }),
    [data, proposalsById],
  );

  const columns: ColumnDef<SnapshotVoteRow>[] = [
    {
      accessorKey: "proposalTitle",
      header: () => <h4 className="text-table-header">Proposal</h4>,
      meta: { columnClassName: "w-1/2" },
      cell: ({ row }) =>
        isLoading ? (
          <SkeletonRow className="h-5 w-48" />
        ) : (
          <Link
            href={getDaoProposalPath({
              daoId,
              pathname,
              proposalId: row.original.proposalId,
              isOffchain: true,
            })}
            className="text-primary hover:border-primary block max-w-80 truncate border-b border-dashed border-[#3F3F46] text-sm transition-colors"
          >
            {row.original.proposalTitle}
          </Link>
        ),
    },
    {
      accessorKey: "choice",
      header: () => <h4 className="text-table-header">Vote</h4>,
      cell: ({ row }) =>
        isLoading ? (
          <SkeletonRow className="h-5 w-16" />
        ) : (
          // Approval and ranked votes list several options; the full text
          // stays one hover away instead of spilling into the next column.
          <span
            title={row.original.choice}
            className={cn(
              "block max-w-48 truncate text-sm",
              CHOICE_TONE[row.original.choice.toLowerCase()] ?? "text-primary",
            )}
          >
            {row.original.choice}
          </span>
        ),
    },
    {
      accessorKey: "votingPower",
      header: () => (
        <h4 className="text-table-header w-full text-right">Voting power</h4>
      ),
      cell: ({ row }) =>
        isLoading ? (
          <SkeletonRow className="ml-auto h-5 w-16" />
        ) : (
          <span className="text-primary block w-full text-right text-sm">
            {row.original.votingPower === null
              ? "-"
              : formatNumberUserReadable(row.original.votingPower)}
          </span>
        ),
    },
    {
      accessorKey: "votedAt",
      header: () => (
        <h4 className="text-table-header w-full text-right">Date</h4>
      ),
      cell: ({ row }) =>
        isLoading ? (
          <SkeletonRow className="ml-auto h-5 w-20" />
        ) : (
          <span className="text-secondary block w-full text-right text-sm">
            {formatDateUserReadable(new Date(row.original.votedAt * 1000))}
          </span>
        ),
    },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden p-4">
      <Table
        columns={columns}
        data={isLoading ? Array(PAGE_SIZE).fill({}) : rows}
        size="sm"
        enableExpanding={!isLoading}
        getRowCanExpand={(row) => !!row.original.reason}
        renderSubComponent={(row) =>
          row.original.reason ? (
            <VoteReason reason={row.original.reason} />
          ) : null
        }
        hasMore={!!hasNextPage}
        isLoadingMore={isFetchingNextPage}
        onLoadMore={fetchNextPage}
        withDownloadCSV
        csvFilename="snapshot-votes.csv"
        customEmptyState={
          <EmptyState
            title="No Snapshot votes"
            description="This address has not voted on Snapshot in this DAO."
          />
        }
        error={error}
        fillHeight
      />
    </div>
  );
};
