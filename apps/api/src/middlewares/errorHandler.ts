import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

import { logger } from "@/logger";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  if (err instanceof ZodError) {
    const validationError = fromZodError(err);
    return c.json(
      {
        error: "Validation Error",
        message: validationError.message,
      },
      400,
    );
  }

  // viem errors carry a one-line shortMessage; err.message is multi-line.
  const cause =
    (err as Error & { shortMessage?: string }).shortMessage ?? err.message;
  logger.error(
    { err, url: c.req.path, method: c.req.method },
    `unhandled error: ${cause}`,
  );

  return c.json(
    {
      error: "Internal Server Error",
      message: "Internal Server Error",
    },
    500,
  );
};
