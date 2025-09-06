"use client";

import { Building2 } from "lucide-react";

import { ProposalStatus, ProposalState } from "@/features/governance/types";
import type { Proposal } from "@/features/governance/types";

import { ProposalItem } from "@/features/governance/components/ProposalItem";
import { TheSectionLayout } from "@/shared/components";

// Mock data based on the snapshot
const mockProposals: Proposal[] = [
  {
    id: "1",
    title: "Updating the Code of Conduct & DAO's Procedures",
    status: ProposalStatus.PENDING,
    state: ProposalState.WAITING_TO_START,
    proposer: "isadorable.eth",
    votes: {
      for: 0,
      against: 0,
      total: 0,
      forPercentage: 0,
      againstPercentage: 0,
    },
    quorum: 1000000,
    timeRemaining: "10d to start",
    hasCheckmark: true,
  },
  {
    id: "2",
    title: "Suggestion for Modifying the Community Conduct and DAO Guidelines",
    status: ProposalStatus.ONGOING,
    state: ProposalState.ACTIVE,
    proposer: "isadorable.eth",
    votes: {
      for: 1040000,
      against: 78000,
      total: 1300000,
      forPercentage: 80,
      againstPercentage: 6,
    },
    quorum: 1000000,
    timeRemaining: "3d days left",
    hasCheckmark: true,
  },
  {
    id: "3",
    title: "Initiative to Revise the Community Standards and DAO Procedures",
    status: ProposalStatus.EXECUTED,
    state: ProposalState.COMPLETED,
    proposer: "isadorable.eth",
    votes: {
      for: 1630000,
      against: 0,
      total: 1630000,
      forPercentage: 100,
      againstPercentage: 0,
    },
    quorum: 1000000,
    timeAgo: "1 week ago",
    hasCheckmark: true,
  },
  {
    id: "4",
    title:
      "Proposal for Refining the Community Code of Conduct and DAO Processes",
    status: ProposalStatus.DEFEATED,
    state: ProposalState.COMPLETED,
    proposer: "isadorable.eth",
    votes: {
      for: 249200,
      against: 1494800,
      total: 1780000,
      forPercentage: 14,
      againstPercentage: 84,
    },
    quorum: 1000000,
    timeAgo: "1 week ago",
  },
  {
    id: "5",
    title: "Plan for Updating the Community Code and DAO Practices",
    status: ProposalStatus.EXECUTED,
    state: ProposalState.COMPLETED,
    proposer: "isadorable.eth",
    votes: {
      for: 1630000,
      against: 0,
      total: 1630000,
      forPercentage: 100,
      againstPercentage: 0,
    },
    quorum: 1000000,
    timeAgo: "1 week ago",
  },
  {
    id: "6",
    title: "Draft for Revising the Community Guidelines and DAO Procedures",
    status: ProposalStatus.EXECUTED,
    state: ProposalState.COMPLETED,
    proposer: "isadorable.eth",
    votes: {
      for: 1630000,
      against: 0,
      total: 1630000,
      forPercentage: 100,
      againstPercentage: 0,
    },
    quorum: 1000000,
    timeAgo: "1 week ago",
    hasCheckmark: true,
  },
  {
    id: "7",
    title: "Outline for Updating the Community Standards and DAO Operations",
    status: ProposalStatus.EXECUTED,
    state: ProposalState.COMPLETED,
    proposer: "isadorable.eth",
    votes: {
      for: 1630000,
      against: 0,
      total: 1630000,
      forPercentage: 100,
      againstPercentage: 0,
    },
    quorum: 1000000,
    timeAgo: "1 week ago",
    hasCheckmark: true,
  },
  {
    id: "8",
    title: "Proposal for Enhancing the Community Guidelines and DAO Operations",
    status: ProposalStatus.CANCELLED,
    state: ProposalState.COMPLETED,
    proposer: "isadorable.eth",
    votes: {
      for: 10000,
      against: 888000,
      total: 1010000,
      forPercentage: 1,
      againstPercentage: 88,
    },
    quorum: 1000000,
    timeAgo: "1 week ago",
  },
];

export const GovernanceSection = () => {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <TheSectionLayout
        title="Governance"
        icon={<Building2 className="section-layout-icon" />}
        description="View and vote on executable proposals from this DAO."
        anchorId="governance"
      >
        <div className="flex-1">
          <div className="flex flex-col gap-4 space-y-0">
            {mockProposals.map((proposal) => (
              <ProposalItem key={proposal.id} proposal={proposal} />
            ))}
          </div>
        </div>
      </TheSectionLayout>
      {/* Proposals List */}
    </div>
  );
};
