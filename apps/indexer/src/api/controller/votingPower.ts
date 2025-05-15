import { and, eq, inArray, sum } from "ponder";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator as validator } from "@hono/zod-validator";
import { db } from "ponder:api";
import { accountPower } from "ponder:schema";
import { isAddress } from "viem";
import { DaoIdEnum } from "@/lib/enums";
import { caseInsensitiveEnum } from "../middlewares";

export function votingPower(app: Hono) {
  // sums the voting power of the accounts for a given dao
  // e.g. /dao/ens/voting-power?accounts=0x1,accounts=0x2
  app.get(
    "/dao/:daoId/voting-power",
    validator("param", z.object({ daoId: caseInsensitiveEnum(DaoIdEnum) })),
    validator(
      "query",
      z.object({
        accounts: z
          .union([
            z.array(z.string().refine((val) => isAddress(val))),
            z.string().refine((val) => isAddress(val)),
          ])
          .transform((val) => (Array.isArray(val) ? val : [val]))
          .optional(),
      }),
    ),
    async (context) => {
      const { daoId } = context.req.valid("param");
      const { accounts } = context.req.valid("query");

      const queryResult = await db
        .select({
          sum: sum(accountPower.votingPower),
        })
        .from(accountPower)
        .where(
          /* eslint-disable */
          accounts
            ? and(
              eq(accountPower.daoId, daoId),
              inArray(accountPower.accountId, accounts),
            )
            : eq(accountPower.daoId, daoId),
          /* eslint-enable */
        );

      if (queryResult.length) {
        return context.json({ votingPower: queryResult[0]?.sum || 0n });
      }

      return context.json(
        {
          message: "No data found",
        },
        404,
      );
    },
  );
}
