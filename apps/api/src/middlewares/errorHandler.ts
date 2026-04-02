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

  logger.error(
    { err, url: c.req.path, method: c.req.method },
    "unhandled error",
  );

  return c.json(
    {
      error: "Internal Server Error",
      message: err instanceof Error ? err.message : "Unknown error",
    },
    500,
  );
};
