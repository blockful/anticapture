import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { DaoIdEnum } from "@/lib/enums";
import { ProposalsActivityService } from "@/api/services/proposals-activity/proposals-activity.service";
import { ProposalsActivityRepository } from "@/api/repositories/proposals-activity.repository";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import {
  ProposalActivityRequest,
  ProposalActivityResponse,
} from "@/api/mappers";

export function proposalsActivity(
  app: Hono,
  repository: ProposalsActivityRepository,
  daoId: DaoIdEnum,
) {
  const service = new ProposalsActivityService(repository);

  app.openapi(
    createRoute({
      method: "get",
      operationId: "proposalsActivity",
      path: "/proposals-activity",
      summary: "Get proposals activity for delegate",
      description:
        "Returns proposal activity data including voting history, win rates, and detailed proposal information for the specified delegate within the given time window",
      tags: ["proposals-activity"],
      request: {
        query: ProposalActivityRequest,
      },
      responses: {
        200: {
          description: "Successfully retrieved proposals activity",
          content: {
            "application/json": {
              schema: ProposalActivityResponse,
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

      return context.json(result, 200);
    },
  );
}
