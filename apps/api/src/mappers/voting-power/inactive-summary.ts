import { z } from "@hono/zod-openapi";

import { inclusiveDateRangeQueryParams } from "../shared";

export const InactiveVotingPowerSummaryRequestSchema = z
  .object({
    ...inclusiveDateRangeQueryParams("the delegate activity window"),
  })
  .openapi("InactiveVotingPowerSummaryRequest", {
    description:
      "Optional time-window query params used to compute delegate inactivity.",
  });

export type InactiveVotingPowerSummaryRequest = z.infer<
  typeof InactiveVotingPowerSummaryRequestSchema
>;

export const InactiveVotingPowerSummaryResponseSchema = z
  .object({
    totalDelegatedVotingPower: z.string().openapi({
      description:
        "Sum of all positive delegated voting power, encoded as a decimal string.",
      format: "bigint",
    }),
    inactiveDelegatedVotingPower: z.string().openapi({
      description:
        "Delegated voting power assigned to delegates that cast zero votes on proposals within the window, encoded as a decimal string.",
      format: "bigint",
    }),
    inactivePercentage: z.number().openapi({
      description:
        "Share of delegated voting power assigned to inactive delegates, as a percentage (0-100). Zero when no proposal existed in the window.",
    }),
    totalProposals: z.number().int().openapi({
      description:
        "Number of proposals whose voting period falls within the window.",
    }),
  })
  .openapi("InactiveVotingPowerSummaryResponse", {
    description:
      "Summary of delegated voting power assigned to inactive delegates.",
  });

export type InactiveVotingPowerSummaryResponse = z.infer<
  typeof InactiveVotingPowerSummaryResponseSchema
>;

export type DBInactiveVotingPowerSummary = {
  totalDelegatedVotingPower: bigint;
  inactiveDelegatedVotingPower: bigint;
  totalProposals: number;
};
