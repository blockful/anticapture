import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import type { ErrorHandler } from "hono";

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
      400
    );
  }

  return c.json(
    {
      error: "Internal Server Error",
      message: err instanceof Error ? err.message : "Unknown error",
    },
    500
  );
};
