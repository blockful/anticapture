"use client";

import { useProposalsActivity } from "@/features/holders-and-delegates/hooks/useProposalsActivity";
import {
  QueryInput_ProposalsActivity_OrderBy,
  QueryInput_ProposalsActivity_OrderDirection,
  QueryInput_ProposalsActivity_UserVoteFilter,
} from "@anticapture/graphql-client";
import { useState, useEffect } from "react";
import { MetricCard } from "@/shared/components";
import { ProposalsTable } from "@/features/holders-and-delegates";
import { Hand, Trophy, Check, Zap } from "lucide-react";
import { Pagination } from "@/shared/components/design-system/table/Pagination";
import { DaoIdEnum } from "@/shared/types/daos";
import { FilterOption } from "@/shared/components/dropdowns/FilterDropdown";
import { SECONDS_PER_DAY } from "@/shared/constants/time-related";

interface DelegateProposalsActivityProps {
  address: string;
  daoId: DaoIdEnum;
  fromDate?: number;
}

export const DelegateProposalsActivity = ({
  address,
  daoId,
  fromDate,
}: DelegateProposalsActivityProps) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [userVoteFilter, setUserVoteFilter] = useState<string>("all");
  const [orderBy, setOrderBy] = useState<string>("timestamp");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc");
  const itemsPerPage = 10;

  // Filter options for user vote
  const userVoteFilterOptions: FilterOption[] = [
    { value: "all", label: "All Votes" },
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "abstain", label: "Abstain" },
    { value: "no_vote", label: "Didn't Vote" },
  ];

  // Handle sorting changes
  const handleSortChange = (field: string, direction: "asc" | "desc") => {
    setOrderBy(field);
    setOrderDirection(direction);
  };

  // Calculate skip for pagination
  const skip = (currentPage - 1) * itemsPerPage;

  const { data, loading, error, pagination } = useProposalsActivity({
    address,
    daoId,
    fromDate,
    skip,
    limit: itemsPerPage,
    orderBy: orderBy as QueryInput_ProposalsActivity_OrderBy,
    orderDirection:
      orderDirection as QueryInput_ProposalsActivity_OrderDirection,
    userVoteFilter:
      userVoteFilter === "all"
        ? undefined
        : (userVoteFilter as QueryInput_ProposalsActivity_UserVoteFilter),
    itemsPerPage,
  });

  // Update totalPages when not loading to preserve it during loading
  useEffect(() => {
    if (!loading && pagination.totalPages) {
      setTotalPages(pagination.totalPages);
    }
  }, [loading, pagination.totalPages]);

  // Helper function to format average time (convert seconds to days)
  const formatAvgTime = (
    avgTimeBeforeEndSeconds: number,
    votedProposals: number,
  ): string => {
    const avgTimeBeforeEndDays = avgTimeBeforeEndSeconds / SECONDS_PER_DAY;

    if (!votedProposals) {
      return "-";
    }

    if (avgTimeBeforeEndDays < 1) {
      return "< 1d before the end";
    }
    return `${Math.round(avgTimeBeforeEndDays)}d before the end`;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Prepare values - undefined when loading/error, actual values when data is available
  const votedProposalsValue =
    loading || error || !data
      ? undefined
      : `${data.votedProposals}/${data.totalProposals} (${Math.round((data.votedProposals / (data.totalProposals || 1)) * 100)}%)`;

  const winRateValue =
    loading || error || !data ? undefined : `${data.winRate.toFixed(1)}%`;

  const yesRateValue =
    loading || error || !data ? undefined : `${data.yesRate.toFixed(1)}%`;

  const avgTimingValue =
    loading || error || !data
      ? undefined
      : formatAvgTime(data.avgTimeBeforeEnd, data.votedProposals);

  return (
    <>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard
            icon={<Hand className="size-3.5" />}
            title="Voted Proposals"
            value={votedProposalsValue}
          />
          <MetricCard
            icon={<Trophy className="size-3.5" />}
            title="Win Rate"
            value={winRateValue}
          />
          <MetricCard
            icon={<Check className="size-3.5" />}
            title="For Rate"
            value={yesRateValue}
          />
          <MetricCard
            icon={<Zap className="size-3.5" />}
            title="Avg. Vote Timing"
            value={avgTimingValue}
          />
        </div>
      </div>

      {/* Proposals Table */}
      <div className="px-4 pb-4">
        <div className="flex flex-col gap-2">
          <ProposalsTable
            proposals={data?.proposals || []}
            loading={loading}
            error={error}
            userVoteFilter={userVoteFilter}
            onUserVoteFilterChange={setUserVoteFilter}
            userVoteFilterOptions={userVoteFilterOptions}
            orderBy={orderBy}
            orderDirection={orderDirection}
            onSortChange={handleSortChange}
            daoIdEnum={daoId}
          />

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevious={() => handlePageChange(currentPage - 1)}
            onNext={() => handlePageChange(currentPage + 1)}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            className="text-white"
          />
        </div>
      </div>
    </>
  );
};
