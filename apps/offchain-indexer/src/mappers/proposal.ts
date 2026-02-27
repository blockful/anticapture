import { z } from "zod"

// "nullish().transform" is necessary here because provider return null instead of undefined
export const rawProposalSchema = z.object({
  id: z.string(),
  author: z.string(),
  title: z.string(),
  body: z.string().nullish().transform((val) => val ?? ""),
  discussion: z.string().nullish().transform((val) => val ?? ""),
  type: z.string().nullish().transform((val) => val ?? "single-choice"),
  start: z.number(),
  end: z.number(),
  state: z.string().nullish().transform((val) => val ?? "closed"),
  created: z.number(),
  updated: z.number().nullish(),
  link: z.string().nullish().transform((val) => val ?? ""),
  flagged: z.boolean().nullish().transform((val) => val ?? false)
});

export const offchainProposalSchema = (spaceId: string) =>
  rawProposalSchema.transform((raw) => ({
    ...raw,
    spaceId,
    updated: raw.updated ?? raw.created,
  }));