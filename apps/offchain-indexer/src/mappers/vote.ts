import { z } from "zod" 

export const rawVoteSchema = z.object({
  id: z.string(),
  voter: z.string(),
  proposal: z.object({id: z.string()}),
  choice: z.unknown(),
  vp: z.number().nullish().transform((val) => val ?? 0),
  reason: z.string().nullish().transform((val) => val ?? ""),
  created: z.number()
});

export const toOffchainVote = (spaceId: string) => {
  return rawVoteSchema.transform(({ proposal, choice, ...rest }) => ({
    ...rest,
    spaceId,
    proposalId: proposal.id,
    choice,
  }))
}
