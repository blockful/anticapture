import { z } from "@hono/zod-openapi";

import { delegation } from "@/database";
import { AddressSchema } from "../shared";

export type DBDelegation = typeof delegation.$inferSelect;

export const DelegationsRequestParamsSchema = z
  .object({
    address: AddressSchema,
  })
  .openapi("DelegationsRequestParams", {
    description: "Path params for fetching current delegations of an account.",
  });
