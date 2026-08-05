import { z } from "zod";

import { BODY_CHAR_LIMIT } from "@/features/create-proposal/constants";
import { isAddressLike } from "@/shared/utils/address";
import { isEnsAddress } from "@/shared/utils/ens";
import { customActionIssues } from "@/features/create-proposal/utils/validateCustomAction";

/* The rules, in one place, for every entry point. An action the import accepts but
 * the form rejects surfaces only as a Publish button that never enables — action
 * rows draw no field errors — so there has to be one of them. */
export const addressOrEnsSchema = z
  .string()
  .min(1, "Required")
  .refine((v) => {
    const trimmed = v.trim();
    return isAddressLike(trimmed) || isEnsAddress(trimmed);
  }, "Must be a valid address or ENS name");

export const strictAddressSchema = z
  .string()
  .min(1, "Required")
  .refine((v) => isAddressLike(v), "Must be a valid Ethereum address");

export const ETH_DECIMALS = 18;

const fractionDigits = (amount: string): number =>
  (amount.trim().split(".")[1] ?? "").length;

/** `parseUnits` rounds an over-precise amount instead of refusing it: `0.0000001`
 *  of a 6-decimal token becomes 0 base units and the proposal transfers nothing,
 *  while `0.0000009` becomes 1. Nothing downstream notices. */
export const amountPrecisionError = (
  amount: string,
  scale: number,
): string | null =>
  fractionDigits(amount) > scale
    ? `Has more decimal places than this asset can hold (${scale})`
    : null;

export const positiveDecimalAmountSchema = z
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

const CustomActionSchema = z.object({
  type: z.literal("custom"),
  contractAddress: addressOrEnsSchema,
  abi: z.array(z.any()),
  functionName: z.string(),
  args: z.array(z.string()),
  calldata: z.string().optional(),
  value: z.string().optional(),
});

/** Attached to the action, not the form, which is what lets the import dialog hold
 *  a pasted action to it before the form exists. */
const refineCustomAction = (
  action: z.infer<typeof CustomActionSchema>,
  ctx: z.RefinementCtx,
): void => {
  customActionIssues(action).forEach(({ path, message }) => {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message, path });
  });
};

export const ProposalActionSchema = z
  .discriminatedUnion("type", [
    EthTransferSchema,
    ERC20TransferSchema,
    CustomActionSchema,
  ])
  .superRefine((action, ctx) => {
    if (action.type === "custom") refineCustomAction(action, ctx);
  });

/** The form's own members, with `decimals` left open: a pasted value is a claim
 *  about someone else's contract, settled against the token before handoff. */
export const PendingProposalActionSchema = z
  .discriminatedUnion("type", [
    EthTransferSchema,
    ERC20TransferSchema.extend({
      decimals: z.number().int().nonnegative().optional(),
    }),
    CustomActionSchema,
  ])
  .superRefine((action, ctx) => {
    if (action.type === "custom") refineCustomAction(action, ctx);
  });

export const titleSchema = z.string().min(1, "Required");

export const discussionUrlSchema = z
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
  }, "Must be a valid URL");

export const bodySchema = z
  .string()
  .min(1, "Required")
  .max(BODY_CHAR_LIMIT, "100,000 character limit");

export const ProposalFormSchema = z
  .object({
    title: titleSchema,
    discussionUrl: discussionUrlSchema,
    body: bodySchema,
    actions: z
      .array(ProposalActionSchema)
      .min(1, "At least one action is required"),
  })
  // Only what needs the whole action settled first: an ERC-20's scale is known only
  // once `decimals` is filled in. Everything else lives on `ProposalActionSchema`,
  // so the import sees it too.
  .superRefine((form, ctx) => {
    form.actions.forEach((action, index) => {
      if (action.type === "custom") return;
      const scale =
        action.type === "erc20-transfer" ? action.decimals : ETH_DECIMALS;
      const precision = amountPrecisionError(action.amount, scale);
      if (precision) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: precision,
          path: ["actions", index, "amount"],
        });
      }
    });
  });

export type ProposalFormValues = z.infer<typeof ProposalFormSchema>;
