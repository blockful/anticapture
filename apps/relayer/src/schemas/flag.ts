import { z } from "zod";

const ON = new Set(["true", "1", "yes", "on"]);
const OFF = new Set(["false", "0", "no", "off", ""]);

/**
 * An on/off environment flag that refuses anything it does not recognise.
 *
 * A kill switch read as `value === "true"` is silently off for "TRUE", "1" or
 * "yes", which is exactly what an operator types under pressure. Reading the
 * common spellings, and failing the parse on any other value, makes a typo
 * stop the process at boot instead of leaving the switch off. An unset or
 * empty variable is off.
 */
export const envFlag = z
  .string()
  .optional()
  .transform((value, ctx) => {
    const normalized = (value ?? "").trim().toLowerCase();
    if (ON.has(normalized)) return true;
    if (OFF.has(normalized)) return false;
    ctx.addIssue({
      code: "custom",
      message: `Expected true/false, 1/0, yes/no or on/off, got "${value}"`,
    });
    return z.NEVER;
  });
