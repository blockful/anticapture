import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { DAOClient } from "@/interfaces/client";
import { DaoIdEnum } from "@/lib/enums";

export function dao(app: Hono, daoId: DaoIdEnum, client: DAOClient) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "dao",
      path: "/daos",
      summary: "Get dao infos",
      description: "Fetch dao infos",
      tags: ["dao"],
      request: {
        query: z.object({
          proposalId: z.string().optional(),
        }),
      },
      responses: {
        200: {
          description: "Successfully retrieved dao infos",
          content: {
            "application/json": {
              schema: z.object({
                id: z.string(),
                quorum: z.string(),
                proposalThreshold: z.string(),
                votingDelay: z.string(),
                votingPeriod: z.string(),
                timelockDelay: z.string(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const { proposalId } = context.req.valid("query");

      const [
        votingPeriod,
        quorum,
        votingDelay,
        timelockDelay,
        proposalThreshold,
      ] = await Promise.all([
        client.getVotingPeriod(),
        client.getQuorum(proposalId || null),
        client.getVotingDelay(),
        client.getTimelockDelay(),
        client.getProposalThreshold(),
      ]);

      return context.json(
        {
          id: daoId,
          quorum: quorum.toString(),
          proposalThreshold: proposalThreshold.toString(),
          votingDelay: votingDelay.toString(),
          votingPeriod: votingPeriod.toString(),
          timelockDelay: timelockDelay.toString(),
        },
        200,
      );
    },
  );
}
