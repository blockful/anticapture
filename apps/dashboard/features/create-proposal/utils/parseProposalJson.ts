import { z } from "zod";

import type { ProposalFormValues } from "@/features/create-proposal/schema";
import { parseAbiStrict } from "@/features/create-proposal/utils/fetchAbi";

type FormAction = ProposalFormValues["actions"][number];

/**
 * The fields an imported JSON can carry. Everything is optional: a partial
 * document fills what it provides and leaves the rest of the form untouched.
 */
export type ParsedProposalJson = {
  title?: string;
  discussionUrl?: string;
  body?: string;
  actions?: FormAction[];
};

export type ParseProposalJsonResult =
  | { ok: true; value: ParsedProposalJson }
  | { ok: false; error: string };

/** JSON authors write amounts as `"1.5"` or `1.5`; the form stores strings. */
const numericString = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim());

const EthTransferImportSchema = z.object({
  type: z.literal("eth-transfer"),
  recipient: z.string().trim().min(1, "Required"),
  amount: numericString,
});

const Erc20TransferImportSchema = z.object({
  type: z.literal("erc20-transfer"),
  recipient: z.string().trim().min(1, "Required"),
  tokenAddress: z.string().trim().min(1, "Required"),
  amount: numericString,
  // Deliberately required: defaulting to 18 would silently scale a USDC
  // transfer by 12 orders of magnitude.
  decimals: z.number().int().nonnegative(),
});

// `abi` stays `unknown` here so a malformed ABI produces a readable message
// from the outer superRefine instead of a wall of zod union errors. The
// function/calldata cross-field rule lives there too, keeping this a plain
// ZodObject so the discriminated union below accepts it.
const CustomImportSchema = z.object({
  type: z.literal("custom"),
  contractAddress: z.string().trim().min(1, "Required"),
  abi: z.unknown().optional(),
  functionName: z.string().trim().optional(),
  args: z.array(numericString).optional(),
  calldata: z.string().trim().optional(),
  value: numericString.optional(),
});

const ActionImportSchema = z.discriminatedUnion("type", [
  EthTransferImportSchema,
  Erc20TransferImportSchema,
  CustomImportSchema,
]);

// Unknown keys are stripped rather than rejected, so a saved draft (which
// carries `id`, `daoId`, timestamps) can be pasted in as-is.
const ProposalJsonSchema = z
  .object({
    title: z.string().optional(),
    discussionUrl: z.string().optional(),
    body: z.string().optional(),
    actions: z.array(ActionImportSchema).optional(),
  })
  .superRefine((json, ctx) => {
    json.actions?.forEach((action, index) => {
      if (action.type !== "custom") return;

      const hasCalldata = Boolean(action.calldata);
      const hasFunctionName = Boolean(action.functionName);

      if (!hasCalldata && !hasFunctionName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'needs either "functionName" or "calldata"',
          path: ["actions", index],
        });
      }

      if (action.abi !== undefined && parseAbiStrict(action.abi) === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "must be an array of ABI items",
          path: ["actions", index, "abi"],
        });
      }

      if (hasFunctionName && !hasCalldata && action.abi === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'is required when "functionName" is used',
          path: ["actions", index, "abi"],
        });
      }
    });
  });

type ImportedAction = z.infer<typeof ActionImportSchema>;

const toFormAction = (action: ImportedAction): FormAction => {
  if (action.type !== "custom") return action;

  // Validated in superRefine above; spread to the mutable array the
  // zod-inferred form type expects.
  const abi =
    action.abi === undefined ? [] : [...(parseAbiStrict(action.abi) ?? [])];

  return {
    type: "custom",
    contractAddress: action.contractAddress,
    abi,
    functionName: action.functionName ?? "",
    args: action.args ?? [],
    ...(action.calldata ? { calldata: action.calldata } : {}),
    ...(action.value !== undefined ? { value: action.value } : {}),
  };
};

/** `actions[1].recipient: Required`, readable enough to fix the paste. */
const formatIssue = (issue: z.ZodIssue): string => {
  const path = issue.path.reduce<string>((acc, segment) => {
    if (typeof segment === "number") return `${acc}[${segment}]`;
    return acc ? `${acc}.${segment}` : String(segment);
  }, "");
  return path ? `${path}: ${issue.message}` : issue.message;
};

/**
 * Parses a pasted proposal document into form values. Validation is strict on
 * the fields it recognizes (they go straight into a form that can publish an
 * on-chain transaction) and lenient about everything else.
 */
export const parseProposalJson = (text: string): ParseProposalJsonResult => {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste the proposal JSON first." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      error:
        "This isn't valid JSON. Check for a missing comma, quote, or bracket.",
    };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      error:
        'Expected a JSON object with "title", "discussionUrl", "body" or "actions".',
    };
  }

  const result = ProposalJsonSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues.slice(0, 3).map(formatIssue).join("; "),
    };
  }

  const { title, discussionUrl, body, actions } = result.data;
  if (
    title === undefined &&
    discussionUrl === undefined &&
    body === undefined &&
    actions === undefined
  ) {
    return {
      ok: false,
      error:
        'No known fields found. Use "title", "discussionUrl", "body" or "actions".',
    };
  }

  return {
    ok: true,
    value: { title, discussionUrl, body, actions: actions?.map(toFormAction) },
  };
};
