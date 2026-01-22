import { DaysEnum } from "@/lib/enums";
import { z } from "@hono/zod-openapi";
import { isAddress } from "viem";

export type AmountFilter = {
  minAmount: number | bigint | undefined;
  maxAmount: number | bigint | undefined;
};

export const PeriodResponseSchema = z.object({
  startTimestamp: z.string(),
  endTimestamp: z.string(),
});

export type PeriodResponse = z.infer<typeof PeriodResponseSchema>;

export const TimestampResponseMapper = (timestamp: number): string =>
  new Date(timestamp * 1000).toISOString();

// TODO: Comprehensive refactor to eliminate repetitions througout codebase
export const FromDateStandardRequestParam = z
  .string()
  .optional()
  .transform((val) =>
    Number(
      val
        ? val
        : Number(Math.floor(Date.now() / 1000) - DaysEnum["90d"]).toString(),
    ),
  );

export const ToDateStandardRequestParam = z
  .string()
  .optional()
  .transform((val) =>
    Number(val ? val : Math.floor(Date.now() / 1000).toString()),
  );

export const LimitStandardRequestParam = z.coerce
  .number()
  .int()
  .min(1, "Limit must be a positive integer")
  .max(100, "Limit cannot exceed 100")
  .optional()
  .default(20);

export const OffsetStandardRequestParam = z.coerce
  .number()
  .int()
  .min(0, "Skip must be a non-negative integer")
  .optional()
  .default(0);

export const OrderDirectionStandardRequestParam = z
  .enum(["asc", "desc"])
  .optional()
  .default("desc");

export const AddressSetStandardRequestParam = z.union([
  z
    .string()
    .refine(isAddress, "Invalid address")
    .transform((addr) => [addr]),
  z.array(z.string().refine(isAddress, "Invalid addresses")),
]);
