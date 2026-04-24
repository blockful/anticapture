import { z } from "zod";

import { isValidAddressOrEns } from "@/features/create-proposal/utils/addressValidation";
import { isAddress } from "viem";

const addressOrEnsSchema = z
  .string()
  .min(1, "Required")
  .refine((v) => isValidAddressOrEns(v), "Must be a valid address or ENS name");

const strictAddressSchema = z
  .string()
  .min(1, "Required")
  .refine((v) => isAddress(v.trim()), "Must be a valid Ethereum address");

const EthTransferSchema = z.object({
  type: z.literal("eth-transfer"),
  recipient: addressOrEnsSchema,
  amount: z.string().min(1, "Required"),
});

const ERC20TransferSchema = z.object({
  type: z.literal("erc20-transfer"),
  recipient: addressOrEnsSchema,
  tokenAddress: strictAddressSchema,
  amount: z.string().min(1, "Required"),
  decimals: z.number().int().nonnegative(),
});

const CustomActionSchema = z.object({
  type: z.literal("custom"),
  contractAddress: addressOrEnsSchema,
  abi: z.array(z.any()),
  functionName: z.string().min(1, "Required"),
  args: z.array(z.string()),
  calldata: z.string().optional(),
  value: z.string().optional(),
});

export const ProposalActionSchema = z.discriminatedUnion("type", [
  EthTransferSchema,
  ERC20TransferSchema,
  CustomActionSchema,
]);

export const ProposalFormSchema = z.object({
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
  actions: z.array(ProposalActionSchema),
});

export type ProposalFormValues = z.infer<typeof ProposalFormSchema>;
