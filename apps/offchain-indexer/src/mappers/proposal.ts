import { getAddress, isAddress } from "viem";
import { z } from "zod";

// "nullish().transform" is necessary here because provider return null instead of undefined
export const rawProposalSchema = z.object({
  id: z.string(),
  author: z
    .string()
    .refine((val) => isAddress(val, { strict: false }))
    .transform((val) => getAddress(val)),
  title: z.string(),
  body: z
    .string()
    .nullish()
    .transform((val) => val ?? ""),
  discussion: z
    .string()
    .nullish()
    .transform((val) => val ?? ""),
  type: z
    .string()
    .nullish()
    .transform((val) => val ?? "single-choice"),
  start: z.number(),
  end: z.number(),
  state: z
    .string()
    .nullish()
    .transform((val) => val ?? "closed"),
  created: z.number(),
  updated: z.number().nullish(),
  link: z
    .string()
    .nullish()
    .transform((val) => val ?? ""),
  flagged: z
    .boolean()
    .nullish()
    .transform((val) => val ?? false),
  scores: z
    .array(z.number())
    .nullish()
    .transform((val) => val ?? []),
  choices: z
    .array(z.string())
    .nullish()
    .transform((val) => val ?? []),
  network: z
    .string()
    .nullish()
    .transform((val) => val ?? ""),
  snapshot: z
    .number()
    .nullish()
    .transform((val) => val ?? null),
  strategies: z
    .array(
      z.object({
        name: z.string(),
        network: z.string(),
        params: z.record(z.unknown()),
      }),
    )
    .nullish()
    .transform((val) => val ?? []),
});

export const offchainProposalSchema = (spaceId: string) =>
  rawProposalSchema.transform((raw) => ({
    ...raw,
    spaceId,
    updated: raw.updated ?? raw.created,
  }));
