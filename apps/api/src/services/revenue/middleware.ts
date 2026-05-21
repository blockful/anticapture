import { createMiddleware } from "hono/factory";

import { env } from "@/env";
import { DaoIdEnum } from "@/lib/enums";

export const ensOnly = createMiddleware(async (c, next) => {
  if (env.DAO_ID !== DaoIdEnum.ENS) {
    return c.json({ error: "Not Found" }, 404);
  }
  await next();
});
