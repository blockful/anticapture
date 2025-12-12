import { createRoute, OpenAPIHono as Hono } from "@hono/zod-openapi";
import { AccountBalanceService } from "@/api/services";
import {
  AccountBalanceResponseMapper,
  AccountBalanceResponseSchema,
} from "@/api/mappers";
import { Address } from "viem";

export function accountBalance(app: Hono, service: AccountBalanceService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "accountBalance",
      path: "/account-balances/:accountId",
      summary: "Get account balance",
      description: "Returns account balance",
      tags: ["account-balances"],
      responses: {
        200: {
          description: "Successfully retrieved account balance",
          content: {
            "application/json": {
              schema: AccountBalanceResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const accountId = context.req.param("accountId");
      const result = await service.getAccountBalance(accountId as Address);
      return context.json(AccountBalanceResponseMapper(result));
    },
  );
}
