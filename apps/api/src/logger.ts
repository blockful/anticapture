import { createLogger } from "@blockful/observability";

import { env } from "@/env";

export const logger = createLogger("api", { dao: env.DAO_ID });
