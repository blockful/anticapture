import { createLogger } from "@anticapture/observability";

import { env } from "@/env";

export const logger = createLogger("api", { dao: env.DAO_ID });
