"use client";

import {
  orderDirectionEnum,
  type OffchainSearchProposalsPathParamsDaoEnumKey,
  type SearchProposalsPathParamsDaoEnumKey,
} from "@anticapture/client";
import {
  useOffchainSearchProposals,
  useSearchProposals,
} from "@anticapture/client/hooks";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Building2, Landmark, MessageSquare, Plus, Search } from "lucide-react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import {
  DraftCard,
  DraftEmptyState,
  DeleteDraftModal,
  useDrafts,
} from "@/features/create-proposal";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import { copyDraftShareUrl } from "@/features/create-proposal/utils/draftShareUrl";
import { canCreateProposalForDao } from "@/features/create-proposal/constants";
import { ProposalItem } from "@/features/governance/components/proposal-overview/ProposalItem";
import {
  useOffchainProposals,
  type OffchainProposalItem,
} from "@/features/governance/hooks/useOffchainProposals";
import { useProposals } from "@/features/governance/hooks/useProposals";
import {
  isFullProposal,
  type OnchainFullProposalItem,
  type Proposal as GovernanceProposal,
} from "@/features/governance/types";
import {
  getProposalState,
  getProposalStatus,
  getTimeText,
} from "@/features/governance/utils";
import { TheSectionLayout } from "@/shared/components";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { Select } from "@/shared/components/design-system/form/fields/select/Select";
import { TabGroup } from "@/shared/components/design-system/tabs/tab-group/TabGroup";
import type { TabItem } from "@/shared/components/design-system/tabs/types";
import { EmptyState } from "@/shared/components/design-system/table/components/EmptyState";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getWhitelabelBasePath } from "@/shared/utils/whitelabel";

const ALL_PROPOSALS_TAB = {
  label: (
    <>
      <span className="lg:hidden">All</span>
      <span className="hidden lg:inline">All Proposals</span>
    </>
  ),
  value: "all",
};

const SOURCE_FILTER_ITEMS = [
  { label: "All sources", value: "all" },
  { label: "Snapshot", value: "snapshot" },
  { label: "Governor", value: "governor" },
];

type ProposalSourceFilter = "all" | "snapshot" | "governor";

type MergedProposalItem =
  | { source: "onchain"; startTs: number; proposal: GovernanceProposal }
  | { source: "offchain"; startTs: number; proposal: OffchainProposalItem };

const toGovernanceProposal = (
  proposal: OnchainFullProposalItem,
  decimals: number,
): GovernanceProposal => {
  const forVotes = Number(formatUnits(proposal.forVotes, decimals));
  const againstVotes = Number(formatUnits(proposal.againstVotes, decimals));
  const abstainVotes = Number(formatUnits(proposal.abstainVotes, decimals));
  const quorum = Number(formatUnits(proposal.quorum, decimals));
  const total = forVotes + againstVotes + abstainVotes;
  const forPercentage = total > 0 ? (forVotes / total) * 100 : 0;
  const againstPercentage = total > 0 ? (againstVotes / total) * 100 : 0;
  const abstainPercentage = total > 0 ? (abstainVotes / total) * 100 : 0;

  return {
    ...proposal,
    title: proposal.title || "Untitled Proposal",
    status: getProposalStatus(proposal.status),
    state: getProposalState(proposal.status),
    proposer: proposal.proposerAccountId,
    votes: {
      for: forVotes.toFixed(2),
      against: againstVotes.toFixed(2),
      abstain: abstainVotes.toFixed(2),
      total: total.toFixed(2),
      // Keep precision for bar widths; consumers round for display
      forPercentage: forPercentage.toFixed(2),
      againstPercentage: againstPercentage.toFixed(2),
      abstainPercentage: abstainPercentage.toFixed(2),
    },
    quorum: quorum.toFixed(2),
    timeText: getTimeText(
      proposal.startTimestamp.toString(),
      proposal.endTimestamp.toString(),
    ),
    values: proposal.values.map((value) => value.toString()),
    targets: proposal.targets,
  };
};

export const GovernanceSection = () => {
  const { daoId }: { daoId: string } = useParams();
  const pathname = usePathname();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;

  const basePath = getWhitelabelBasePath({ daoId: daoIdEnum, pathname });
  const hasOffchain = !!daoConfig[daoIdEnum]?.offchainProposals;
  const canCreateProposal = canCreateProposalForDao(daoIdEnum);
  const { decimals } = daoConfig[daoIdEnum];
  const router = useRouter();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringEnum<"all" | "drafts">(["all", "drafts"]).withDefault("all"),
  );

  const [sourceFilter, setSourceFilter] = useQueryState(
    "source",
    parseAsStringEnum<ProposalSourceFilter>([
      "all",
      "snapshot",
      "governor",
    ]).withDefault("all"),
  );

  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const {
    drafts,
    deleteDraft,
    isLoading: isDraftsLoading,
    error: draftsError,
    retry: retryDrafts,
  } = useDrafts(daoId);
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const trimmedSearch = search.trim();
  const isSearchActive = trimmedSearch.length > 0;

  const {
    data: proposals,
    isLoading: onchainLoading,
    error: onchainError,
    fetchNextPage: fetchNextOnchain,
    isFetchingNextPage: isOnchainPaginationLoading,
    hasNextPage: hasNextOnchainPage,
  } = useProposals({
    limit: 10,
    orderDirection: orderDirectionEnum.desc,
    daoId: daoIdEnum,
    fromDate: undefined,
    status: undefined,
    fromEndDate: undefined,
    includeOptimisticProposals: undefined,
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

  const { data: searchData, isLoading: searchLoading } = useSearchProposals(
    daoIdEnum.toLowerCase() as SearchProposalsPathParamsDaoEnumKey,
    { query: trimmedSearch || " ", limit: 50 },
    { query: { enabled: isSearchActive } },
  );

  const { data: offchainSearchData, isLoading: offchainSearchLoading } =
    useOffchainSearchProposals(
      daoIdEnum.toLowerCase() as OffchainSearchProposalsPathParamsDaoEnumKey,
      { query: trimmedSearch || " ", limit: 50 },
      { query: { enabled: isSearchActive && hasOffchain } },
    );

  const searchOnchainProposals = useMemo(() => {
    if (!isSearchActive) return [];
    return (searchData?.items ?? [])
      .filter(isFullProposal)
      .map((p) => toGovernanceProposal(p, decimals));
  }, [isSearchActive, searchData, decimals]);

  const searchOffchainProposals = useMemo(() => {
    if (!isSearchActive) return [];
    return offchainSearchData?.items ?? [];
  }, [isSearchActive, offchainSearchData]);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const visibleTabs = useMemo(() => {
    const tabs: TabItem[] = [ALL_PROPOSALS_TAB];
    if (isConnected && canCreateProposal) {
      tabs.push({ label: "My Drafts", value: "drafts" });
    }
    return tabs;
  }, [canCreateProposal, isConnected]);

  // DAOs without offchain proposals ignore the source filter — otherwise a
  // stale ?source=snapshot in the URL would render an empty, unrecoverable list
  const effectiveSource = hasOffchain ? sourceFilter : "all";
  const showOnchain = effectiveSource !== "snapshot";
  const showOffchain = hasOffchain && effectiveSource !== "governor";

  const error =
    (showOnchain ? onchainError : null) ??
    (showOffchain ? offchainError : null);
  const isPaginationLoading =
    (showOnchain && isOnchainPaginationLoading) ||
    (showOffchain && isOffchainPaginationLoading);

  // Both sources are paginated independently, so the merged list is only
  // chronologically safe down to the older of the two loaded frontiers —
  // items below that line could still interleave with unfetched pages.
  const mergedProposals = useMemo<MergedProposalItem[]>(() => {
    const onchainList = showOnchain
      ? isSearchActive
        ? searchOnchainProposals
        : proposals
      : [];
    const offchainList = showOffchain
      ? isSearchActive
        ? searchOffchainProposals
        : offchainProposals
      : [];

    const merged: MergedProposalItem[] = [
      ...onchainList.map((proposal) => ({
        source: "onchain" as const,
        startTs: Number(proposal.startTimestamp),
        proposal,
      })),
      ...offchainList.map((proposal) => ({
        source: "offchain" as const,
        startTs: Number(proposal.start),
        proposal,
      })),
    ].sort((a, b) => b.startTs - a.startTs);

    if (isSearchActive) return merged;

    let cutoff = 0;
    if (showOnchain && hasNextOnchainPage && onchainList.length > 0) {
      cutoff = Math.max(
        cutoff,
        Math.min(...onchainList.map((p) => Number(p.startTimestamp))),
      );
    }
    if (
      showOffchain &&
      offchainPagination.hasNextPage &&
      offchainList.length > 0
    ) {
      cutoff = Math.max(
        cutoff,
        Math.min(...offchainList.map((p) => Number(p.start))),
      );
    }

    return cutoff > 0
      ? merged.filter((item) => item.startTs >= cutoff)
      : merged;
  }, [
    showOnchain,
    showOffchain,
    isSearchActive,
    searchOnchainProposals,
    searchOffchainProposals,
    proposals,
    offchainProposals,
    hasNextOnchainPage,
    offchainPagination.hasNextPage,
  ]);

  const handleLoadMore = useCallback(() => {
    if (showOnchain && hasNextOnchainPage && !isOnchainPaginationLoading) {
      fetchNextOnchain();
    }
    if (
      showOffchain &&
      offchainPagination.hasNextPage &&
      !isOffchainPaginationLoading
    ) {
      fetchNextOffchain();
    }
  }, [
    showOnchain,
    showOffchain,
    hasNextOnchainPage,
    offchainPagination.hasNextPage,
    isOnchainPaginationLoading,
    isOffchainPaginationLoading,
    fetchNextOnchain,
    fetchNextOffchain,
  ]);

  useEffect(() => {
    if (activeTab === "drafts" && (!isConnected || !canCreateProposal)) {
      void setActiveTab("all");
    }
  }, [activeTab, canCreateProposal, isConnected, setActiveTab]);

  useEffect(() => {
    if (isSearchActive) return;
    const ref = loadMoreRef.current;
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
  }, [handleLoadMore, isSearchActive]);

  const handleNewProposal = () => {
    if (!isConnected) {
      openConnectModal?.();
    } else {
      router.push(`${basePath}/proposals/new`);
    }
  };

  const forumLink = daoConfig[daoIdEnum]?.forumLink;

  const headerActions = (
    <div className="flex w-full items-center gap-2 lg:w-auto">
      {forumLink && (
        <Button
          variant="outline"
          size="md"
          asChild
          className="flex-1 whitespace-nowrap lg:w-fit lg:flex-none"
        >
          <a href={forumLink} target="_blank" rel="noopener noreferrer">
            <MessageSquare className="size-4" />
            Forum
          </a>
        </Button>
      )}
      {canCreateProposal && (
        <Button
          variant="primary"
          size="md"
          onClick={handleNewProposal}
          className="flex-1 whitespace-nowrap lg:w-fit lg:flex-none"
          data-umami-event="proposal_create_click"
          data-umami-event-dao={daoId}
          data-ph-event="proposal_create_click"
          data-ph-source="governance_overview"
          data-ph-dao={daoId}
        >
          <Plus className="size-4" />
          New Proposal
        </Button>
      )}
    </div>
  );

  if (error && activeTab !== "drafts") {
    return (
      <div className="bg-background flex min-h-screen flex-col">
        <TheSectionLayout
          title="Proposals"
          icon={<Building2 className="section-layout-icon" />}
          description="View and vote on executable proposals from this DAO."
          headerAction={headerActions}
        >
          <TabGroup
            tabs={visibleTabs}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as "all" | "drafts")}
            className="mb-4"
            size="md"
            variant="button"
          />
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
    <div>
      <TheSectionLayout
        title="Proposals"
        icon={<Landmark className="section-layout-icon" />}
        description="View and vote on executable proposals from this DAO."
        className="lg:bg-transparent"
        hideDivider
        headerAction={headerActions}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <TabGroup
            tabs={visibleTabs}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as "all" | "drafts")}
            size="md"
            variant="button"
          />
          {hasOffchain && activeTab === "all" && (
            <Select
              items={SOURCE_FILTER_ITEMS}
              value={sourceFilter}
              onValueChange={(value) =>
                setSourceFilter(value as ProposalSourceFilter)
              }
              className="w-[150px] lg:w-[248px]"
            />
          )}
        </div>

        <div className="flex-1">
          {activeTab === "drafts" && isConnected ? (
            <>
              {isDraftsLoading ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <DraftCardSkeleton key={i} />
                  ))}
                </div>
              ) : draftsError && drafts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <EmptyState
                    title="Failed to load drafts"
                    description="Something went wrong while fetching your drafts."
                  />
                  <Button variant="outline" size="md" onClick={retryDrafts}>
                    Retry
                  </Button>
                </div>
              ) : drafts.length === 0 ? (
                <DraftEmptyState />
              ) : (
                <div className="flex flex-col gap-2">
                  {draftsError && (
                    <div className="border-warning/30 bg-warning/10 flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                      <span className="text-secondary">
                        Couldn&apos;t sync drafts with the server. Showing local
                        copies.
                      </span>
                      <Button variant="outline" size="sm" onClick={retryDrafts}>
                        Retry
                      </Button>
                    </div>
                  )}
                  {drafts.map((draft) => (
                    <DraftCard
                      key={draft.id}
                      draft={draft}
                      onEdit={(id) =>
                        router.push(`${basePath}/proposals/new?draftId=${id}`)
                      }
                      onDelete={(id) => setDraftToDelete(id)}
                      onShare={async (id) => {
                        const copied = await copyDraftShareUrl(basePath, id);
                        if (copied) {
                          showCustomToast("Share link copied", "success");
                        } else {
                          showCustomToast("Could not copy link", "error");
                        }
                      }}
                    />
                  ))}
                </div>
              )}
              <DeleteDraftModal
                open={draftToDelete !== null}
                onOpenChange={(open) => {
                  if (!open) setDraftToDelete(null);
                }}
                onConfirm={async () => {
                  if (draftToDelete !== null) {
                    const id = draftToDelete;
                    setDraftToDelete(null);
                    try {
                      await deleteDraft(id);
                    } catch {
                      showCustomToast("Could not delete draft", "error");
                    }
                  }
                }}
              />
            </>
          ) : (
            <ProposalListSection
              loading={
                isSearchActive
                  ? (showOnchain && searchLoading) ||
                    (showOffchain && offchainSearchLoading)
                  : (showOnchain && onchainLoading) ||
                    (showOffchain && offchainLoading)
              }
              hasItems={mergedProposals.length > 0}
              isPaginationLoading={isSearchActive ? false : isPaginationLoading}
              loadMoreRef={loadMoreRef}
              isSearchActive={isSearchActive}
              emptyMessage="No proposals found"
            >
              {mergedProposals.map((item) =>
                item.source === "onchain" ? (
                  <ProposalItem
                    key={`onchain-${item.proposal.id}`}
                    proposal={item.proposal}
                  />
                ) : (
                  <ProposalItem
                    key={`offchain-${item.proposal.id}`}
                    offchainProposal={item.proposal}
                  />
                ),
              )}
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
  isSearchActive,
  emptyMessage,
  children,
}: {
  loading: boolean;
  hasItems: boolean;
  isPaginationLoading: boolean;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  isSearchActive: boolean;
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
    if (isSearchActive) {
      return (
        <BlankSlate
          variant="default"
          icon={Search}
          description="No proposals match your search"
        />
      );
    }
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

const DraftCardSkeleton = () => (
  <div className="border-border-default bg-surface-default rounded-base flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-1 flex-col gap-1">
      <div className="flex items-center gap-2">
        <SkeletonRow className="h-4 w-48" />
        <SkeletonRow className="h-4 w-12" />
      </div>
      <SkeletonRow className="h-3 w-32" />
    </div>
    <div className="flex gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonRow key={i} className="h-8 w-20" />
      ))}
    </div>
  </div>
);

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
