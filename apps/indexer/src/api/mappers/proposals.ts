import { z } from "zod";

import { Proposal } from "@/api/repositories/proposals-activity.repository";

export const ProposalSchema = z.object({
  id: z.string(),
  daoId: z.string(),
  proposerAccountId: z.string(),
  targets: z.array(z.string()),
  values: z.array(z.string()),
  signatures: z.array(z.string()),
  calldatas: z.array(z.string()),
  startBlock: z.string(),
  endBlock: z.string(),
  description: z.string().nullable(),
  timestamp: z.string(),
  status: z.string(),
  forVotes: z.string(),
  againstVotes: z.string(),
  abstainVotes: z.string(),
  quorumReached: z.boolean(),
  currentQuorum: z.string(),
});

export type ProposalAPI = z.infer<typeof ProposalSchema>;

export const ProposalMapper = {
  toAPI: (
    proposal: Proposal,
    additionalData: {
      quorumReached: boolean;
      currentQuorum: string;
    },
  ): ProposalAPI => {
    return {
      id: proposal.id,
      daoId: proposal.daoId,
      proposerAccountId: proposal.proposerAccountId,
      targets: (proposal.targets as string[]) || [],
      values: (proposal.values as string[]) || [],
      signatures: (proposal.signatures as string[]) || [],
      calldatas: (proposal.calldatas as string[]) || [],
      startBlock: proposal.startBlock,
      endBlock: proposal.endBlock,
      description: proposal.description,
      timestamp: proposal.timestamp.toString(),
      status: proposal.status,
      forVotes: proposal.forVotes.toString(),
      againstVotes: proposal.againstVotes.toString(),
      abstainVotes: proposal.abstainVotes.toString(),
      quorumReached: additionalData.quorumReached,
      currentQuorum: additionalData.currentQuorum,
    };
  },
};
