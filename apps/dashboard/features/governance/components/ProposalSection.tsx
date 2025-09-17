"use client";

import { useParams } from "next/navigation";
import { useProposal } from "@/features/governance/hooks/useProposal";
import { SkeletonRow } from "@/shared/components";

import { ProposalStatusSection } from "@/features/governance/components/ProposalStatusSection";
import { ProposalInfoSection } from "@/features/governance/components/ProposalInfoSection";
import { TitleSection } from "@/features/governance/components/TitleSection";

export const ProposalSection = () => {
  const { proposalId } = useParams();

  const { proposal, loading, error } = useProposal({
    proposalId: proposalId as string,
  });

  console.log(proposal);

  if (loading) {
    return (
      <>
        <SkeletonRow className="h-10 w-full" />
        <div className="text-primary p-4">Loading...</div>
      </>
    );
  }

  if (error) {
    return <div className="text-primary p-4">Error: {error.message}</div>;
  }

  if (!proposal) {
    return <div className="text-primary p-4">Proposal not found</div>;
  }

  // Load proposal by id

  // If proposal is not found, show 404 page

  // If proposal is found, show proposal section with proposal details

  return (
    <div className="flex p-5">
      <div className="flex w-[420px] flex-col gap-6">
        <TitleSection proposal={proposal} />

        <ProposalInfoSection proposal={proposal} />

        <ProposalStatusSection proposal={proposal} />
      </div>
    </div>
  );
};
