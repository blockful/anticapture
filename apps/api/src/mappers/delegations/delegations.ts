import { delegation } from "@/database";
import { addressPathParams } from "../shared";

export type DBDelegation = typeof delegation.$inferSelect;

export const DelegationsRequestParamsSchema = addressPathParams(
  "DelegationsRequestParams",
  "Path params for fetching current delegations of an account.",
);
