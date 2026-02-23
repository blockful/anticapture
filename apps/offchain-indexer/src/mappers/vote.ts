import { z } from "zod" 

export const rawVoteSchema = z.object({
  id: z.string(),
  voter: z.string(),
  proposal: z.object({id: z.string()}),
  choice: z.unknown().default(null),
  vp: z.number().default(0),
  reason: z.string().default(""),
  created: z.number()
});

export const toOffchainVote = (spaceId: string) => {
  return rawVoteSchema.transform((raw) => ({
    ...raw,
    spaceId,
    proposalId: raw.proposal.id,
    choice: raw.choice
  }))
}
