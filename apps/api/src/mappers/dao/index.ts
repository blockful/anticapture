import { z } from "@hono/zod-openapi";

import { NOT_APPLICABLE } from "../constants";

export const DaoParametersRequestQuerySchema = z.object({
  fromDate: z
    .string()
    .transform((val) => Number(val))
    .optional(),
  fetchGovernanceData: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true"),
});

export const DaoParametersResponseSchema = z.object({
  id: z.string(),
  chainId: z.number(),
  quorum: z.string(),
  proposalThreshold: z.string(),
  votingDelay: z.string(),
  votingPeriod: z.string(),
  timelockDelay: z.string(),
  governanceData: z
    .object({
      activeSupply: z.string(),
      averageTurnout: z.object({
        oldAverageTurnout: z.string(),
        currentAverageTurnout: z.string(),
        changeRate: z.string(),
      }),
      quorumGap: z.string(),
      lastPrice: z.string(),
    })
    .nullable(),
});

export type DaoParametersResponse = z.infer<typeof DaoParametersResponseSchema>;

export const DaoParametersRPCResponseSchema = z.object({
  id: z.string(),
  chainId: z.number(),
  quorum: z.bigint(),
  proposalThreshold: z.bigint(),
  votingDelay: z.bigint(),
  votingPeriod: z.bigint(),
  timelockDelay: z.bigint(),
});

export type DaoParametersRPCResponse = z.infer<
  typeof DaoParametersRPCResponseSchema
>;

export const DaoParametersDBResponseSchema = z.object({
  // TODO: Rename
  activeSupply: z
    .object({
      activeSupply: z.string(),
    })
    .nullable(),
  averageTurnout: z.object({
    currentAverageTurnout: z.string(),
    oldAverageTurnout: z.string(),
    changeRate: z.number(),
  }),
  quorumGap: z.number().nullable(),
  lastPrice: z.string(),
});

export type DaoParametersDBResponse = z.infer<
  typeof DaoParametersDBResponseSchema
>;

export const DaoResponseMapper = (values: {
  rpcData: DaoParametersRPCResponse;
  dbData: DaoParametersDBResponse | null;
}): DaoParametersResponse => {
  const { rpcData, dbData } = values;

  return {
    id: rpcData.id,
    chainId: rpcData.chainId,
    quorum: rpcData.quorum.toString(),
    proposalThreshold: rpcData.proposalThreshold.toString(),
    votingDelay: rpcData.votingDelay.toString(),
    votingPeriod: rpcData.votingPeriod.toString(),
    timelockDelay: rpcData.timelockDelay.toString(),
    governanceData: dbData
      ? {
          activeSupply: dbData.activeSupply?.activeSupply ?? "0",
          averageTurnout: {
            ...dbData.averageTurnout,
            changeRate: dbData.averageTurnout.changeRate.toString(),
          },
          quorumGap:
            dbData.quorumGap !== null
              ? dbData.quorumGap.toString()
              : NOT_APPLICABLE,
          lastPrice: dbData.lastPrice,
        }
      : null,
  };
};
