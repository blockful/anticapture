import { z } from "zod";

// === ZOD SCHEMAS ===

export const DelegationPercentageItemSchema = z.object({
  date: z.string(),
  high: z.string(),
});

export const PageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  endCursor: z.string().nullable(),
  startCursor: z.string().nullable(),
});

export const DelegationPercentageResponseSchema = z.object({
  items: z.array(DelegationPercentageItemSchema),
  totalCount: z.number(),
  pageInfo: PageInfoSchema,
});

// === INFERRED TYPES ===

export type DelegationPercentageItem = z.infer<
  typeof DelegationPercentageItemSchema
>;
export type PageInfo = z.infer<typeof PageInfoSchema>;
export type DelegationPercentageResponse = z.infer<
  typeof DelegationPercentageResponseSchema
>;
