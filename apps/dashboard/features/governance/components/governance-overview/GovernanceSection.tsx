"use client";

import { OrderDirection } from "@anticapture/graphql-client";
import { Building2, Landmark } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, type RefObject } from "react";

import { ProposalItem } from "@/features/governance/components/proposal-overview/ProposalItem";
import { useOffchainProposals } from "@/features/governance/hooks/useOffchainProposals";
import { useProposals } from "@/features/governance/hooks/useProposals";
import { TheSectionLayout } from "@/shared/components";
import { TabGroup } from "@/shared/components/design-system/tabs/tab-group/TabGroup";
import { EmptyState } from "@/shared/components/design-system/table/components/EmptyState";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

const PROPOSAL_TABS = [
  { label: "Onchain", value: "onchain" },
  { label: "Offchain", value: "offchain" },
];

export const GovernanceSection = () => {
  const { daoId }: { daoId: string } = useParams();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const hasOffchain = !!daoConfig[daoIdEnum]?.offchainProposals;
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringEnum<"onchain" | "offchain">([
      "onchain",
      "offchain",
    ]).withDefault("onchain"),
  );

  const {
    proposals,
    loading: onchainLoading,
    error: onchainError,
    pagination: onchainPagination,
    fetchNextPage: fetchNextOnchain,
    isPaginationLoading: isOnchainPaginationLoading,
  } = useProposals({
    itemsPerPage: 10,
    orderDirection: OrderDirection.Desc,
    daoId: daoIdEnum,
    fromDate: null,
    status: null,
    fromEndDate: null,
    includeOptimisticProposals: null,
  });

  const {
    proposals: offchainProposals,
    loading: offchainLoading,
    error: offchainError,
    pagination: offchainPagination,
    fetchNextPage: fetchNextOffchain,
    isPaginationLoading: isOffchainPaginationLoading,
  } = useOffchainProposals({
    itemsPerPage: 10,
    daoId: hasOffchain ? daoIdEnum : undefined,
  });

  const loadMoreOnchainRef = useRef<HTMLDivElement>(null);
  const loadMoreOffchainRef = useRef<HTMLDivElement>(null);

  const isOnchain = activeTab === "onchain" || !hasOffchain;
  const error = isOnchain ? onchainError : offchainError;
  const pagination = isOnchain ? onchainPagination : offchainPagination;
  const isPaginationLoading = isOnchain
    ? isOnchainPaginationLoading
    : isOffchainPaginationLoading;
  const fetchNextPage = isOnchain ? fetchNextOnchain : fetchNextOffchain;

  const handleLoadMore = useCallback(() => {
    if (!isPaginationLoading && pagination.hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, isPaginationLoading, pagination.hasNextPage]);

  useEffect(() => {
    const ref = isOnchain
      ? loadMoreOnchainRef.current
      : loadMoreOffchainRef.current;
    if (!ref) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [handleLoadMore, isOnchain]);

  if (error) {
    return (
      <div className="bg-background flex min-h-screen flex-col">
        <TheSectionLayout
          title="Proposals"
          icon={<Building2 className="section-layout-icon" />}
          description="View and vote on executable proposals from this DAO."
        >
          {hasOffchain && (
            <TabGroup
              tabs={PROPOSAL_TABS}
              activeTab={activeTab}
              onTabChange={(value) =>
                setActiveTab(value as "onchain" | "offchain")
              }
              className="mb-4"
              size="md"
            />
          )}
          <div className="flex flex-col items-center justify-center py-12">
            <EmptyState
              title="Unable to load proposals"
              description="Please try again later"
            />
          </div>
        </TheSectionLayout>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <TheSectionLayout
        title="Proposals"
        icon={<Landmark className="section-layout-icon" />}
        description="View and vote on executable proposals from this DAO."
        className="lg:bg-transparent"
      >
        {hasOffchain && (
          <TabGroup
            tabs={PROPOSAL_TABS}
            activeTab={activeTab}
            onTabChange={(value) =>
              setActiveTab(value as "onchain" | "offchain")
            }
            className="mb-4"
            size="md"
          />
        )}

        <div className="flex-1">
          {isOnchain ? (
            <ProposalListSection
              loading={onchainLoading}
              hasItems={proposals.length > 0}
              isPaginationLoading={isOnchainPaginationLoading}
              loadMoreRef={loadMoreOnchainRef}
              emptyMessage="No proposals found"
            >
              {proposals.map((proposal) => (
                <ProposalItem key={proposal.id} proposal={proposal} />
              ))}
            </ProposalListSection>
          ) : (
            <ProposalListSection
              loading={offchainLoading}
              hasItems={offchainProposals.length > 0}
              isPaginationLoading={isOffchainPaginationLoading}
              loadMoreRef={loadMoreOffchainRef}
              emptyMessage="No off-chain proposals found"
            >
              {offchainProposals.map((proposal) => (
                <ProposalItem key={proposal.id} offchainProposal={proposal} />
              ))}
            </ProposalListSection>
          )}
        </div>
      </TheSectionLayout>
    </div>
  );
};

const ProposalListSection = ({
  loading,
  hasItems,
  isPaginationLoading,
  loadMoreRef,
  emptyMessage,
  children,
}: {
  loading: boolean;
  hasItems: boolean;
  isPaginationLoading: boolean;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  emptyMessage: string;
  children: React.ReactNode;
}) => {
  if (loading && !hasItems) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <ProposalItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 space-y-0">{children}</div>
      <div ref={loadMoreRef} className="py-4">
        {isPaginationLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProposalItemSkeleton key={`pagination-skeleton-${i}`} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const ProposalItemSkeleton = () => {
  return (
    <div className="bg-surface-default relative flex w-full flex-col items-center justify-between gap-3 px-3 py-3 lg:flex-row lg:gap-6">
      <div className="bg-surface-hover absolute left-0 top-1/2 h-[calc(100%-24px)] w-[2px] -translate-y-1/2 animate-pulse" />

      <div className="flex w-full flex-col items-start justify-between gap-2 lg:w-auto">
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

      <div className="flex w-full shrink-0 flex-col items-center gap-1 lg:w-[220px]">
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
