import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";

import { TransfersService } from "@/api/services";
import {
  TransfersRequestSchema,
  TransfersResponseSchema,
} from "@/api/mappers/";
import { isAddress } from "viem";

export function transfers(app: Hono, service: TransfersService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "transfers",
      path: "/accounts/{address}/transfers",
      summary: "Get transfers",
      description: "Get transfers of a given address",
      tags: ["transfers"],
      request: {
        params: z.object({
          address: z.string().refine((addr) => isAddress(addr)),
        }),
        query: TransfersRequestSchema,
      },
      responses: {
        200: {
          description: "Returns transfers",
          content: {
            "application/json": {
              schema: TransfersResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { address } = context.req.valid("param");
      const { from, to } = context.req.valid("query");
      const { limit, offset, sortBy, sortOrder, fromValue, toValue, fromDate } =
        context.req.valid("query");

      const result = await service.getTransfers({
        address,
        limit,
        offset,
        sortBy,
        sortOrder,
        from,
        to,
        fromValue,
        toValue,
        fromDate,
      });

      return context.json(result);
    },
  );
}
