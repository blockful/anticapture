"use client";

import { DaoIdEnum } from "@/shared/types/daos";
import { useDao } from "@/shared/api/generated/governance/governance";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { MetricCard } from "@/shared/components/cards/MetricCard";
import { Settings, Vote, Clock, Timer, Lock, Network } from "lucide-react";

interface DaoGovernanceParamsProps {
  daoId: DaoIdEnum;
}

/**
 * Component that fetches and displays DAO governance parameters
 * using the Orval-generated React Query hook for type-safe REST API calls
 */
export const DaoGovernanceParams = ({ daoId }: DaoGovernanceParamsProps) => {
  // Use the generated React Query hook from Orval
  // You can configure React Query options here:
  const { data, isLoading, error } = useDao({
    request: {
      daoId,
    },
    query: {
      enabled: !!daoId, // Only fetch when daoId is available
      // Add any React Query options here:
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (was cacheTime in v4)
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Don't refetch on component mount if data exists
      retry: 2, // Retry failed requests 2 times
      retryDelay: 1000, // Wait 1 second between retries
      // ... any other React Query UseQueryOptions
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-primary text-lg font-semibold">
          Governance Parameters
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonRow key={i} className="h-15 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-primary text-lg font-semibold">
          Governance Parameters
        </h3>
        <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Error loading governance parameters</p>
          <p className="text-sm">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h3 className="text-primary text-lg font-semibold">
          Governance Parameters
        </h3>
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-gray-600">
          No governance parameters available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-primary text-lg font-semibold">
        Governance Parameters
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          icon={<Vote className="h-4 w-4" />}
          title="Quorum"
          value={data.quorum}
        />
        <MetricCard
          icon={<Settings className="h-4 w-4" />}
          title="Proposal Threshold"
          value={data.proposalThreshold}
        />
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          title="Voting Delay"
          value={`${data.votingDelay} blocks`}
        />
        <MetricCard
          icon={<Timer className="h-4 w-4" />}
          title="Voting Period"
          value={`${data.votingPeriod} blocks`}
        />
        <MetricCard
          icon={<Lock className="h-4 w-4" />}
          title="Timelock Delay"
          value={`${data.timelockDelay} seconds`}
        />
        <MetricCard
          icon={<Network className="h-4 w-4" />}
          title="Chain ID"
          value={data.chainId.toString()}
        />
      </div>
    </div>
  );
};
