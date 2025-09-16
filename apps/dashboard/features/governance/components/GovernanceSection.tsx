"use client";

import { Building2, Landmark, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { useProposals } from "@/features/governance/hooks/useProposals";

import { ProposalItem } from "@/features/governance/components/ProposalItem";
import { TheSectionLayout } from "@/shared/components";
import { Button } from "@/shared/components/ui/button";
import { QueryInput_Proposals_OrderDirection } from "@anticapture/graphql-client";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";

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
        if (
          entries[0].isIntersecting &&
          pagination.hasNextPage &&
          !isPaginationLoading
        ) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleLoadMore, pagination.hasNextPage, isPaginationLoading]);

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
      >
        <div className="flex-1">
          {loading && proposals.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <span className="text-muted-foreground ml-2">
                Loading proposals...
              </span>
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
                  <div className="flex items-center justify-center">
                    <Loader2 className="text-primary h-6 w-6 animate-spin" />
                    <span className="text-muted-foreground ml-2">
                      Loading more proposals...
                    </span>
                  </div>
                )}
              </div>

              {/* Load more button as fallback */}
              {pagination.hasNextPage && !isPaginationLoading && (
                <div className="flex justify-center pt-6">
                  <Button onClick={handleLoadMore} variant="outline">
                    Load More Proposals
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </TheSectionLayout>
    </div>
  );
};
