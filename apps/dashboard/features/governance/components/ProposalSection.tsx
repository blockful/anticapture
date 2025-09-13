"use client";

import { useParams } from "next/navigation";
import { useProposal } from "@/features/governance/hooks/useProposal";
import { SkeletonRow } from "@/shared/components";

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

  // Load proposal by id

  // If proposal is not found, show 404 page

  // If proposal is found, show proposal section with proposal details

  return <div className="text-primary p-4">Proposal section {proposalId}</div>;
};
