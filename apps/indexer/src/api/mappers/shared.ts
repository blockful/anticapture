import { DaysEnum } from "@/lib/enums";
import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";
import { PERIOD_UNBOUND } from "./constants";

export type AmountFilter = {
  minAmount: number | bigint | undefined;
  maxAmount: number | bigint | undefined;
};

export const PeriodResponseSchema = z.object({
  startTimestamp: z.string(),
  endTimestamp: z.string(),
});

export type PeriodResponse = z.infer<typeof PeriodResponseSchema>;

export const TimestampResponseMapper = (
  timestamp: number | undefined,
): string => {
  return timestamp ? new Date(timestamp * 1000).toISOString() : PERIOD_UNBOUND;
};

export const AddressStandardRequestParam = z
  .string()
  .refine(
    (addr) => isAddress(addr, { strict: false }),
    "Invalid Ethereum address",
  )
  .transform((addr) => getAddress(addr));

export const DatetimeStandardRequestParam = z
  .string()
  .transform((val) => Number(val));

// TODO: Comprehensive refactor to eliminate repetitions throughout codebase
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
  AddressStandardRequestParam.transform((val) => [val]),
  z.array(AddressStandardRequestParam),
]);
