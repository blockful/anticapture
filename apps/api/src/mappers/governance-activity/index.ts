import { z } from "@hono/zod-openapi";
import { DaysWindow } from "../shared";

export const GovernanceActivityDaysQuerySchema = z
  .object({
    days: DaysWindow,
  })
  .openapi("GovernanceActivityDaysQuery", {
    description:
      "Shared query params for governance activity comparison endpoints.",
  });

export const ActiveSupplyResponseSchema = z
  .object({
    activeSupply: z.string().openapi({
      description: "Active token supply encoded as a decimal string.",
      example: "1000000000000000000000000",
    }),
  })
  .openapi("ActiveSupplyResponse", {
    description: "Active token supply for the selected comparison window.",
  });

export const ProposalsComparisonResponseSchema = z
  .object({
    currentProposalsLaunched: z.number().int().openapi({
      description: "Number of proposals launched in the current period.",
      example: 8,
    }),
    oldProposalsLaunched: z.number().int().openapi({
      description: "Number of proposals launched in the comparison period.",
      example: 5,
    }),
    changeRate: z.number().openapi({
      description: "Relative change between current and previous periods.",
      example: 0.6,
    }),
  })
  .openapi("ProposalsComparisonResponse", {
    description:
      "Proposal launch comparison between two adjacent time windows.",
  });

export const VotesComparisonResponseSchema = z
  .object({
    currentVotes: z.number().int().openapi({
      description: "Number of votes cast in the current period.",
      example: 128,
    }),
    oldVotes: z.number().int().openapi({
      description: "Number of votes cast in the comparison period.",
      example: 96,
    }),
    changeRate: z.number().openapi({
      description: "Relative change between current and previous periods.",
      example: 0.33,
    }),
  })
  .openapi("VotesComparisonResponse", {
    description: "Vote-count comparison between two adjacent time windows.",
  });

export const AverageTurnoutComparisonResponseSchema = z
  .object({
    currentAverageTurnout: z.string().openapi({
      description:
        "Average turnout for the current period encoded as a string.",
      example: "120000000000000000",
    }),
    oldAverageTurnout: z.string().openapi({
      description:
        "Average turnout for the previous period encoded as a string.",
      example: "90000000000000000",
    }),
    changeRate: z.number().openapi({
      description: "Relative change between current and previous periods.",
      example: 0.33,
    }),
  })
  .openapi("AverageTurnoutComparisonResponse", {
    description:
      "Average turnout comparison between two adjacent time windows.",
  });
