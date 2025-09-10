"use client";

import { useParams } from "next/navigation";

export const ProposalSection = () => {
  const { proposalId } = useParams();

  // Load proposal by id

  // If proposal is not found, show 404 page

  // If proposal is found, show proposal section with proposal details

  return <div>Proposal section {proposalId}</div>;
};
