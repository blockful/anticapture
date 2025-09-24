import { z } from "zod";

export const TokenValueResponseSchema = z.object({
  items: z.array(
    z.object({
      timestamp: z.number(),
      price: z.number(),
    }),
  ),
});

export type TokenValueResponseType = z.infer<typeof TokenValueResponseSchema>;
