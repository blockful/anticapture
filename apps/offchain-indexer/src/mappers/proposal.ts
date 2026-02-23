import { z } from "zod"

export const rawProposalSchema = z.object({
  id: z.string(),
  author: z.string(),
  title: z.string(),
  body: z.string().default(""),
  discussion: z.string().default(""),
  type: z.string().default("single-choice"),
  start: z.number(),
  end: z.number(),
  state: z.string().default("closed"),
  created: z.number(),
  updated: z.number(),
  link: z.string().default(""),
  flagged: z.enum(["true", "false"]).default("false").transform((val) => val === "true")
});

export const offchainProposalSchema = (spaceId: string) =>
  rawProposalSchema.transform((raw) => ({
    ...raw,
    spaceId,
    updated: raw.updated ?? raw.created,
  }));