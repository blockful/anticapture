"use client";

import Link from "next/link";
import { Code2 } from "lucide-react";
import { DaoIdEnum } from "@/shared/types/daos";
import { TooltipInfo } from "@/shared/components";
import { useLastProposals } from "@/features/dao-overview/hooks/useLastProposals";
import { ProposalItem } from "@/features/governance/components/proposal-overview/ProposalItem";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";

const LastProposalsCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="bg-surface-default flex items-center gap-3 p-3"
        >
          <div className="bg-surface-contrast h-12 w-[2px] animate-pulse" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="bg-surface-contrast h-5 w-3/4 animate-pulse rounded" />
            <div className="bg-surface-contrast h-4 w-1/2 animate-pulse rounded" />
          </div>
          <div className="hidden w-[220px] flex-col gap-2 lg:flex">
            <div className="bg-surface-contrast h-4 w-full animate-pulse rounded" />
            <div className="bg-surface-contrast h-1 w-full animate-pulse rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyState = () => {
  return (
    <div className="bg-surface-default text-secondary flex items-center justify-center p-8">
      <p>No proposals found</p>
    </div>
  );
};

const ErrorState = ({ message }: { message: string }) => {
  return (
    <div className="bg-surface-default flex items-center justify-center p-8">
      <p className="text-error">Error loading proposals: {message}</p>
    </div>
  );
};

interface HasCalldataBadgeProps {
  hasCalldata: boolean;
}

/**
 * Badge to indicate a proposal has calldata (smart contract interactions)
 */
export const HasCalldataBadge = ({ hasCalldata }: HasCalldataBadgeProps) => {
  if (!hasCalldata) return null;

  return (
    <div className="bg-surface-solid-brand relative flex size-3.5 shrink-0 items-center justify-center rounded-full shadow-sm">
      <Code2 className="text-inverted size-2.5" />
    </div>
  );
};

export const LastProposalsCard = ({ daoId }: { daoId: DaoIdEnum }) => {
  const { proposals, loading, error } = useLastProposals(daoId);

  const renderContent = () => {
    if (loading) {
      return <LastProposalsCardSkeleton />;
    }

    if (error) {
      return <ErrorState message={error.message} />;
    }

    if (proposals.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className="flex flex-col">
        {proposals.map((proposal, index) => (
          <div key={proposal.id}>
            <ProposalItem
              proposal={proposal}
              className="border-border-default border-b last:border-b-0"
            />
            {index < proposals.length - 1 && (
              <div className="border-border-default border-b" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="border-x border-inverted mx-5">
        <div className="lg:bg-surface-default flex w-full flex-col gap-4 lg:p-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Link
              href={`/${daoId.toLowerCase()}/governance`}
              className="border-border-contrast text-secondary hover:text-primary flex items-center gap-1 border-b border-dashed font-mono text-[13px] font-medium uppercase tracking-wider transition-colors"
            >
              Last proposals
            </Link>
            <TooltipInfo text="The most recent governance proposals for this DAO, ordered by submission date." />
          </div>

          {/* List */}
          <div className="border-border-default overflow-hidden border">
            {renderContent()}
          </div>
        </div>
      </div>
      <div className="block lg:hidden">
        <DividerDefault isHorizontal />
      </div>
    </div>
  );
};
