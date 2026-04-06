"use client";

import type { GetOffchainVotesByProposalIdQuery } from "@anticapture/graphql-client";
import { useGetOffchainVotesByProposalIdQuery } from "@anticapture/graphql-client/hooks";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, CircleMinus, Inbox, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Address } from "viem";

import { VotesTable } from "@/features/governance/components/proposal-overview/VotesTable";
import { BlankSlate, SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";
import { getAuthHeaders } from "@/shared/utils/server-utils";

type OffchainVoteItem = NonNullable<
  NonNullable<
    GetOffchainVotesByProposalIdQuery["votesOffchainByProposalId"]
  >["items"][number]
>;

const LOADING_ROW = "__LOADING_ROW__";

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

const getChoiceInfo = (choice: Array<number | null>, choices: string[]) => {
  if (choice.length === 0) return { label: "—", icon: null as React.ReactNode };

  if (choice.length === 1 && choice[0] != null) {
    const label = choices[choice[0] - 1] ?? `Choice ${choice[0]}`;
    return getLabelDisplay(label);
  }

  const label = choice
    .filter((c): c is number => c != null)
    .map((c) => choices[c - 1] ?? `Choice ${c}`)
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

  const { data, loading, error, fetchMore } =
    useGetOffchainVotesByProposalIdQuery({
      variables: { id: proposalId, limit: 10, skip: 0 },
      context: {
        headers: {
          "anticapture-dao-id": daoId,
          ...getAuthHeaders(),
        },
      },
      skip: !proposalId,
    });

  const votes = useMemo(
    () =>
      (data?.votesOffchainByProposalId?.items ?? []).filter(
        (vote): vote is OffchainVoteItem => vote !== null,
      ),
    [data],
  );
  const totalCount = data?.votesOffchainByProposalId?.totalCount ?? 0;
  const hasNextPage = votes.length < totalCount;

  const loadMore = useCallback(() => {
    fetchMore({
      variables: { skip: votes.length },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult?.votesOffchainByProposalId?.items) return prev;
        return {
          ...prev,
          votesOffchainByProposalId: {
            ...prev.votesOffchainByProposalId!,
            items: [
              ...(prev.votesOffchainByProposalId?.items ?? []),
              ...fetchMoreResult.votesOffchainByProposalId.items,
            ],
          },
        };
      },
    });
  }, [fetchMore, votes.length]);

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
    const rows: (OffchainVoteItem & { isSubRow?: boolean })[] = [];

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

    return rows as OffchainVoteItem[];
  }, [votes, hasNextPage, loading]);

  const columns: ColumnDef<OffchainVoteItem>[] = useMemo(
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
          const choice = row.getValue("choice") as Array<number | null>;
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
          <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
            <p>Date</p>
          </div>
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
          <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
            <p>Voting Power</p>
          </div>
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
    [totalVotingPower, choices],
  );

  if (error) return <div>Error: {error.message}</div>;

  if (loading && votes.length === 0) {
    return (
      <div className="w-full lg:p-4">
        <VotesTable
          columns={columns}
          data={Array.from({ length: 7 }, () => ({}) as OffchainVoteItem)}
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
