import { z } from "zod";
import { isAddress } from "viem";
import { proposalsOnchain, votesOnchain } from "ponder:schema";

export type DbProposal = typeof proposalsOnchain.$inferSelect;
export type DbVote = typeof votesOnchain.$inferSelect;
export type DbProposalWithVote = DbProposal & {
  votes: DbVote[];
};

export enum VoteFilter {
  YES = "yes",
  NO = "no",
  ABSTAIN = "abstain",
  NO_VOTE = "no_vote",
}
export type OrderByField = "votingPower" | "voteTiming" | "timestamp";
export type OrderDirection = "asc" | "desc";

export const ProposalActivityRequest = z.object({
  address: z
    .string()
    .refine((addr) => isAddress(addr), "Invalid Ethereum address"),
  fromDate: z.coerce
    .bigint()
    .positive("From date must be a positive timestamp")
    .optional(),
  skip: z.coerce
    .number()
    .int()
    .min(0, "Skip must be a non-negative integer")
    .default(0)
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be a positive integer")
    .max(100, "Limit cannot exceed 100")
    .default(10)
    .optional(),
  orderBy: z
    .enum(["timestamp", "votingPower", "voteTiming"])
    .default("timestamp")
    .optional(),
  orderDirection: z.enum(["asc", "desc"]).default("desc").optional(),
  userVoteFilter: z
    .nativeEnum(VoteFilter)
    .optional()
    .describe(
      "Filter proposals by vote type. Can be: 'yes' (For votes), 'no' (Against votes), 'abstain' (Abstain votes), 'no-vote' (Didn't vote)",
    ),
});

export type ProposalActivityRequest = z.infer<typeof ProposalActivityRequest>;

const userVoteSchema = z.object({
  txHash: z.string(),
  daoId: z.string(),
  voterAccountId: z.string(),
  proposalId: z.string(),
  support: z.string(),
  votingPower: z.string().default("0"),
  reason: z.string().nullable(),
  timestamp: z.bigint(),
});

export type UserVote = z.infer<typeof userVoteSchema>;

const proposalSchema = z.object({
  id: z.string(),
  proposerAccountId: z.string(),
  description: z.string().nullable(),
  startBlock: z.string(),
  endBlock: z.string(),
  timestamp: z.bigint(),
  status: z.string(),
  forVotes: z.string(),
  againstVotes: z.string(),
  abstainVotes: z.string(),
  userVote: userVoteSchema.optional(),
});

export type APIProposal = z.infer<typeof proposalSchema>;

export const ProposalActivityResponse = z.object({
  address: z.string(),
  totalProposals: z.number(),
  votedProposals: z.number(),
  neverVoted: z.boolean(),
  winRate: z.number(),
  yesRate: z.number(),
  avgTimeBeforeEnd: z.number(),
  proposals: z.array(proposalSchema),
});

export type ProposalActivityResponse = z.infer<typeof ProposalActivityResponse>;

export const ProposalActivityMapper = {
  toApi: (proposal: DbProposalWithVote): APIProposal => {
    return {
      id: proposal.id,
      proposerAccountId: proposal.proposerAccountId,
      description: proposal.description,
      startBlock: proposal.startBlock,
      endBlock: proposal.endBlock,
      timestamp: proposal.timestamp,
      status: proposal.status.toString(),
      forVotes: proposal.forVotes.toString(),
      againstVotes: proposal.againstVotes.toString(),
      abstainVotes: proposal.abstainVotes.toString(),
      userVote: proposal.votes.length === 1 ? proposal.votes[0] : undefined,
    };
  },
};
