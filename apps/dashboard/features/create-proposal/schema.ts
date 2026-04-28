import { z } from "zod";
import { isAddress } from "viem";

import { isEnsAddress } from "@/shared/hooks/useEnsData";

const addressOrEnsSchema = z
  .string()
  .min(1, "Required")
  .refine((v) => {
    const trimmed = v.trim();
    return isAddress(trimmed) || isEnsAddress(trimmed);
  }, "Must be a valid address or ENS name");

const strictAddressSchema = z
  .string()
  .min(1, "Required")
  .refine((v) => isAddress(v.trim()), "Must be a valid Ethereum address");

const positiveDecimalAmountSchema = z
  .string()
  .min(1, "Required")
  .refine((v) => /^\d+(\.\d+)?$/.test(v.trim()), "Must be a valid number")
  .refine((v) => parseFloat(v.trim()) > 0, "Must be greater than 0");

const EthTransferSchema = z.object({
  type: z.literal("eth-transfer"),
  recipient: addressOrEnsSchema,
  amount: positiveDecimalAmountSchema,
});

const ERC20TransferSchema = z.object({
  type: z.literal("erc20-transfer"),
  recipient: addressOrEnsSchema,
  tokenAddress: strictAddressSchema,
  amount: positiveDecimalAmountSchema,
  decimals: z.number().int().nonnegative(),
});

// `functionName` is required only when `calldata` isn't provided. The
// cross-field check happens via `superRefine` on the outer form schema below
// so this object stays a plain `ZodObject` (required for discriminated unions).
const CustomActionSchema = z.object({
  type: z.literal("custom"),
  contractAddress: addressOrEnsSchema,
  abi: z.array(z.any()),
  functionName: z.string(),
  args: z.array(z.string()),
  calldata: z.string().optional(),
  value: z.string().optional(),
});

export const ProposalActionSchema = z.discriminatedUnion("type", [
  EthTransferSchema,
  ERC20TransferSchema,
  CustomActionSchema,
]);

export const ProposalFormSchema = z
  .object({
    title: z.string().min(1, "Required"),
    discussionUrl: z
      .string()
      .optional()
      .refine((v) => {
        if (!v || v.trim() === "") return true;
        try {
          const url = new URL(v.trim());
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      }, "Must be a valid URL"),
    body: z.string().min(1, "Required").max(10_000, "10,000 character limit"),
    actions: z
      .array(ProposalActionSchema)
      .min(1, "At least one action is required"),
  })
  .superRefine((form, ctx) => {
    form.actions.forEach((action, index) => {
      if (action.type !== "custom") return;
      const hasCalldata =
        !!action.calldata && action.calldata.trim().length > 0;
      const hasFunctionName = action.functionName.length > 0;
      if (!hasCalldata && !hasFunctionName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required",
          path: ["actions", index, "functionName"],
        });
      }
    });
  });

export type ProposalFormValues = z.infer<typeof ProposalFormSchema>;
