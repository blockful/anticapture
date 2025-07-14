"use client";

import { useProposalsActivity } from "@/features/holders-and-delegates/hooks/useProposalsActivity";
import { QueryInput_ProposalsActivity_DaoId } from "@anticapture/graphql-client";
import { useEffect, useState } from "react";
import { MetricCard } from "@/shared/components";
import { ProposalsTable } from "@/features/holders-and-delegates";
import { Hand, Trophy, CheckCircle2, Clock10, Check, Zap } from "lucide-react";
import { Pagination } from "@/shared/components/design-system/table/Pagination";
import { useDaoData } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";

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
  const itemsPerPage = 10;

  // Calculate skip for pagination
  const skip = (currentPage - 1) * itemsPerPage;

  const { data, loading, error, refetch } = useProposalsActivity({
    address,
    daoId,
    fromDate,
    skip,
    limit: itemsPerPage,
  });

  // Helper function to format average time (convert seconds to days)
  const formatAvgTime = (avgTimeBeforeEndSeconds: number): string => {
    const avgTimeBeforeEndDays = avgTimeBeforeEndSeconds / (24 * 60 * 60);

    if (avgTimeBeforeEndDays < 1) {
      return "< 1 day before end";
    }
    return `${Math.round(avgTimeBeforeEndDays)} days before end`;
  };

  // Calculate pagination values
  const totalPages = data?.totalProposals
    ? Math.ceil(data.totalProposals / itemsPerPage)
    : 1;
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

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
      : formatAvgTime(data.avgTimeBeforeEnd);

  return (
    <>
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3">
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
            title="Yes Rate"
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
        <div className="flex flex-col gap-4">
          <ProposalsTable
            proposals={data?.proposals || []}
            loading={loading}
            error={error}
          />

          {/* Pagination Controls */}
          {data && data.totalProposals > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPrevious={() => handlePageChange(currentPage - 1)}
              onNext={() => handlePageChange(currentPage + 1)}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              className="text-white"
            />
          )}
        </div>
      </div>
    </>
  );
};
