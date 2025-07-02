"use client";

import { useProposalsActivity } from "@/features/holders-and-delegates/hooks/useProposalsActivity";
import { QueryInput_ProposalsActivity_DaoId } from "@anticapture/graphql-client";
import { useEffect } from "react";
import { MetricCard } from "@/shared/components";
import { Hand, Trophy, CheckCircle2, Clock10 } from "lucide-react";

interface DelegateProposalsActivityProps {
  address: string;
  daoId: QueryInput_ProposalsActivity_DaoId;
  fromDate?: number;
}

export const DelegateProposalsActivity = ({
  address,
  daoId,
  fromDate,
}: DelegateProposalsActivityProps) => {
  const { data, loading, error } = useProposalsActivity({
    address,
    daoId,
    fromDate,
  });

  useEffect(() => {
    console.log("DelegateProposalsActivity hook response:", {
      data,
      loading,
      error,
    });
  }, [data, loading, error]);

  if (loading) {
    return <div className="p-4">Loading proposals activity...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  // Helper function to format average time (convert seconds to days)
  const formatAvgTime = (avgTimeBeforeEndSeconds: number): string => {
    const avgTimeBeforeEndDays = avgTimeBeforeEndSeconds / (24 * 60 * 60);

    if (avgTimeBeforeEndDays < 1) {
      return "< 1 day before end";
    }
    return `${Math.round(avgTimeBeforeEndDays)} days before end`;
  };

  return (
    <>
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3">
          <MetricCard
            icon={<Hand className="size-3.5" />}
            title="Voted Proposals"
            value={`${data?.votedProposals || 0}/${data?.totalProposals || 0} (${Math.round(((data?.votedProposals || 0) / (data?.totalProposals || 1)) * 100)}%)`}
          />
          <MetricCard
            icon={<Trophy className="size-3.5" />}
            title="Win Rate"
            value={`${(data?.winRate || 0).toFixed(1)}%`}
          />
          <MetricCard
            icon={<CheckCircle2 className="size-3.5" />}
            title="Yes Rate"
            value={`${(data?.yesRate || 0).toFixed(1)}%`}
          />
          <MetricCard
            icon={<Clock10 className="size-3.5" />}
            title="Avg. Vote Timing"
            value={formatAvgTime(data?.avgTimeBeforeEnd || 0)}
          />
        </div>
      </div>
    </>
  );
};
