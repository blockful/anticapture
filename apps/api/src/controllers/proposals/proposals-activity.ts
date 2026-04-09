import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DAOClient } from "@/clients";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import {
  ProposalActivityRequestSchema,
  ProposalActivityResponseSchema,
} from "@/mappers";
import { setCacheControl } from "@/middlewares";
import { DrizzleProposalsActivityRepository } from "@/repositories/";
import { ProposalsActivityService } from "@/services";

export function proposalsActivity(
  app: Hono,
  repository: DrizzleProposalsActivityRepository,
  daoId: DaoIdEnum,
  daoClient: DAOClient,
) {
  const service = new ProposalsActivityService(repository, daoClient);

  app.openapi(
    createRoute({
      method: "get",
      operationId: "proposalsActivity",
      path: "/proposals-activity",
      summary: "Get proposals activity for delegate",
      description:
        "Returns proposal activity data including voting history, win rates, and detailed proposal information for the specified delegate within the given time window",
      tags: ["proposals"],
      request: {
        query: ProposalActivityRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved proposals activity",
          content: {
            "application/json": {
              schema: ProposalActivityResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const {
        address,
        fromDate,
        skip,
        limit,
        orderBy,
        orderDirection,
        userVoteFilter,
      } = context.req.valid("query");

      const blockTime = CONTRACT_ADDRESSES[daoId].blockTime;

      const result = await service.getProposalsActivity({
        address,
        fromDate,
        daoId,
        skip,
        limit,
        blockTime,
        orderBy,
        orderDirection,
        userVoteFilter,
      });

      setCacheControl(context, 60);
      return context.json(ProposalActivityResponseSchema.parse(result), 200);
    },
  );
}
