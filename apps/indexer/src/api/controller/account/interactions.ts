import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import {
  AccountInteractionsMapper,
  AccountInteractionsRequestSchema,
  AccountInteractionsResponseSchema,
} from "../../mappers";
import { BalanceVariationsService } from "../../services";
import { Address } from "viem";

export function accountInteractions(
  app: Hono,
  service: BalanceVariationsService,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountInteractions",
      path: "/account-balance/interactions",
      summary: "Get top interactions between accounts for a given period",
      description: `Returns a mapping of the largest interactions between accounts. 
Positive amounts signify net token transfers FROM <accountId>, whilst negative amounts refer to net transfers TO <accountId>`,
      tags: ["transactions"],
      request: {
        query: AccountInteractionsRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved account interactions",
          content: {
            "application/json": {
              schema: AccountInteractionsResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { accountId, days, limit, skip, orderDirection } =
        context.req.valid("query");
      const now = Math.floor(Date.now() / 1000);

      const result = await service.getAccountInteractions(
        accountId as Address,
        now - days,
        skip,
        limit,
        orderDirection,
      );

      console.log({ result });

      return context.json(
        AccountInteractionsMapper(accountId as Address, result, now, days),
      );
    },
  );
}
