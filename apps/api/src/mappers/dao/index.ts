import { z } from "@hono/zod-openapi";

import { ActiveSupplyQueryResult } from "@/controllers";

import { NOT_APPLICABLE } from "../constants";

export const DaoRequestQuerySchema = z.object({
  fromDate: z
    .string()
    .transform((val) => Number(val))
    .optional(),
});

export const DaoResponseSchema = z.object({
  id: z.string(),
  chainId: z.number(),
  quorum: z.string(),
  proposalThreshold: z.string(),
  votingDelay: z.string(),
  votingPeriod: z.string(),
  timelockDelay: z.string(),
  activeSupply: z.string(),
  averageTurnout: z.object({
    oldAverageTurnout: z.string(),
    currentAverageTurnout: z.string(),
    changeRate: z.string(),
  }),
  quorumGap: z.string(),
  lastPrice: z.string(),
});

export type DaoResponse = z.infer<typeof DaoResponseSchema>;

export const DaoResponseMapper = (values: {
  id: string;
  chainId: number;
  quorum: bigint;
  proposalThreshold: bigint;
  votingDelay: bigint;
  votingPeriod: bigint;
  timelockDelay: bigint;
  activeSupply: ActiveSupplyQueryResult | undefined;
  averageTurnout: {
    currentAverageTurnout: string;
    oldAverageTurnout: string;
    changeRate: number;
  };
  quorumGap: number | null;
  lastPrice: string;
}): DaoResponse => {
  return {
    id: values.id,
    chainId: values.chainId,
    quorum: values.quorum.toString(),
    proposalThreshold: values.proposalThreshold.toString(),
    votingDelay: values.votingDelay.toString(),
    votingPeriod: values.votingPeriod.toString(),
    timelockDelay: values.timelockDelay.toString(),
    activeSupply: values.activeSupply?.activeSupply ?? "0",
    averageTurnout: {
      ...values.averageTurnout,
      changeRate: values.averageTurnout.changeRate.toString(),
    },
    quorumGap: values.quorumGap ? values.quorumGap.toString() : NOT_APPLICABLE,
    lastPrice: values.lastPrice,
  };
};
