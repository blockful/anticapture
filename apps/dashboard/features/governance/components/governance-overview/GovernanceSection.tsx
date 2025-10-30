"use client";

import { Building2, Landmark } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { useProposals } from "@/features/governance/hooks/useProposals";

import { ProposalItem } from "@/features/governance/components/proposal-overview/ProposalItem";
import { TheSectionLayout } from "@/shared/components";
import { Button } from "@/shared/components/ui/button";
import { QueryInput_Proposals_OrderDirection } from "@anticapture/graphql-client";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";

export const GovernanceSection = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const {
    proposals, // Now already normalized to Proposal[] format
    loading,
    error,
    pagination,
    fetchNextPage,
    isPaginationLoading,
  } = useProposals({
    itemsPerPage: 10,
    orderDirection: QueryInput_Proposals_OrderDirection.Desc,
    daoId: daoIdEnum,
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll implementation
  const handleLoadMore = useCallback(() => {
    if (!isPaginationLoading && pagination.hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, isPaginationLoading, pagination.hasNextPage]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleLoadMore]);

  if (error) {
    return (
      <div className="bg-background flex min-h-screen flex-col">
        <TheSectionLayout
          title="Governance"
          icon={<Building2 className="section-layout-icon" />}
          description="View and vote on executable proposals from this DAO."
          anchorId="governance"
        >
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-error mb-4">
              Error loading proposals: {error.message}
            </p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </TheSectionLayout>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <TheSectionLayout
        title="Governance"
        icon={<Landmark className="section-layout-icon" />}
        description="View and vote on executable proposals from this DAO."
        anchorId="governance"
        className="sm:bg-transparent"
      >
        <div className="flex-1">
          {loading && proposals.length === 0 ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 10 }).map((_, index) => (
                <ProposalItemSkeleton key={index} />
              ))}
            </div>
          ) : proposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No proposals found</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 space-y-0">
                {proposals.map((proposal) => (
                  <ProposalItem key={proposal.id} proposal={proposal} />
                ))}
              </div>

              {/* Infinite scroll trigger */}
              <div ref={loadMoreRef} className="py-4">
                {isPaginationLoading && (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <ProposalItemSkeleton
                        key={`pagination-skeleton-${index}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </TheSectionLayout>
    </div>
  );
};

const ProposalItemSkeleton = () => {
  return (
    <div className="bg-surface-default relative flex w-full flex-col items-center justify-between gap-3 px-3 py-3 md:flex-row md:gap-6">
      <div className="bg-surface-hover absolute left-0 top-1/2 h-[calc(100%-24px)] w-[2px] -translate-y-1/2 animate-pulse" />

      <div className="flex w-full flex-col items-start justify-between gap-2 md:w-auto">
        <SkeletonRow
          parentClassName="flex animate-pulse"
          className="h-5 w-64"
        />
        <div className="flex items-center gap-2">
          <SkeletonRow
            parentClassName="flex animate-pulse"
            className="h-4 w-16"
          />
          <SkeletonRow
            parentClassName="flex animate-pulse"
            className="h-4 w-24"
          />
          <SkeletonRow
            parentClassName="flex animate-pulse"
            className="h-4 w-32"
          />
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col items-center gap-1 md:w-[220px]">
        <div className="flex w-full items-center justify-between gap-2">
          <SkeletonRow
            parentClassName="flex animate-pulse"
            className="h-4 w-20"
          />
          <div className="flex items-center gap-2">
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-4 w-12"
            />
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-4 w-12"
            />
          </div>
        </div>
        <SkeletonRow
          parentClassName="flex animate-pulse w-full"
          className="h-1 w-full"
        />
      </div>
    </div>
  );
};
