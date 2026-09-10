import { z } from "@hono/zod-openapi";

import { DecimalUint256Schema } from "./evm-primitives";

/**
 * Envelope posted by notification-system's webhook channel. Only
 * `metadata.proposalId` matters; everything else is accepted and ignored so
 * events from other triggers (new proposal, vote cast, ...) are harmless.
 */
export const RelayWebhookBodySchema = z
  .object({
    metadata: z
      .object({ proposalId: DecimalUint256Schema.optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();
