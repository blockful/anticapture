import { serve } from "@hono/node-server";

import { createApp } from "@/app";
import { db } from "@/database";
import { env } from "@/env";
import { logger } from "@/logger";

const app = createApp({ db });

logger.info({ port: env.PORT }, "User API running");

serve({ fetch: app.fetch, port: env.PORT, hostname: "::" });

export { app };
