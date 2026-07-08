import { createLogger } from "@anticapture/observability";

import { env } from "@/env";

export const logger = createLogger(
  `anticapture-${env.DAO_ID.toLowerCase()}-api`,
  { dao: env.DAO_ID },
);
