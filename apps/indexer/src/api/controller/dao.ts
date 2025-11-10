import { z, OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DAOClient } from "@/interfaces/client";
import { DaoIdEnum } from "@/lib/enums";

export function daoController(app: Hono, client: DAOClient, daoId: DaoIdEnum) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "proposal",
      path: "/dao",
      summary: "Get dao data",
      description: "Returns dao data",
      tags: ["dao"],
      responses: {
        200: {
          description: "Successfully retrieved proposal",
          content: {
            "application/json": {
              schema: z.object({
                id: z.string(),
                votingDelay: z.string(),
                votingPeriod: z.string(),
                timelockDelay: z.string(),
                quorum: z.string(),
                proposalThreshold: z.string(),
              }),
            },
          },
        },
      },
    }),
    async (context) => {
      const [
        votingPeriod,
        quorum,
        votingDelay,
        timelockDelay,
        proposalThreshold,
      ] = await Promise.all([
        client.getVotingPeriod(),
        client.getQuorum(null),
        client.getVotingDelay(),
        client.getTimelockDelay(),
        client.getProposalThreshold(),
      ]);

      return context.json({
        id: daoId,
        votingPeriod,
        quorum,
        votingDelay,
        timelockDelay,
        proposalThreshold,
      });
    },
  );
}
