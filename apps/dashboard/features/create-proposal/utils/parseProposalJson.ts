import { isHex, toFunctionSignature, type Abi, type AbiFunction } from "viem";
import { z } from "zod";

import {
  addressOrEnsSchema,
  positiveDecimalAmountSchema,
  strictAddressSchema,
  type ProposalFormValues,
} from "@/features/create-proposal/schema";
import {
  argsToTrees,
  buildEmpty,
  parseArrayType,
} from "@/features/create-proposal/utils/argTree";
import { parseAbiStrict } from "@/features/create-proposal/utils/fetchAbi";
import { isArgComplete } from "@/features/create-proposal/utils/validateArg";

type FormAction = ProposalFormValues["actions"][number];
type Erc20FormAction = Extract<FormAction, { type: "erc20-transfer" }>;

/**
 * An ERC-20 transfer straight out of the document, before its decimals are
 * confirmed against the token contract. A pasted `decimals` is a claim about
 * someone else's contract, and `encodeActions` feeds it to `parseUnits`, so
 * believing it would let "1 USDC" encode as 1e18 base units while the row still
 * reads 1. `resolveImportedDecimals` settles it against the chain.
 */
export type PendingErc20Transfer = Omit<Erc20FormAction, "decimals"> & {
  decimals?: number;
};

export type PendingAction =
  | Exclude<FormAction, { type: "erc20-transfer" }>
  | PendingErc20Transfer;

/**
 * The fields an imported JSON can carry. Everything is optional: a partial
 * document fills what it provides and leaves the rest of the form untouched.
 */
export type ParsedProposalJson = {
  title?: string;
  discussionUrl?: string;
  body?: string;
  actions?: PendingAction[];
};

export type ParseProposalJsonResult =
  | { ok: true; value: ParsedProposalJson }
  | { ok: false; error: string };

/**
 * JSON authors write amounts as `"1.5"` or `1.5`; the form stores strings.
 *
 * Past 2^53 a JSON number is no longer the number that was written: JSON.parse
 * rounds `1000000000000000001` to `1000000000000000000` before anything here
 * runs, and the result is a clean-looking integer that encodes the wrong wei
 * amount. Quoting is the only way to carry those exactly, so unquoted ones are
 * refused rather than silently rounded.
 */
const numericString = z
  .union([z.string(), z.number()])
  .superRefine((value, ctx) => {
    if (typeof value !== "number") return;
    if (Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER) {
      return;
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "is past the precision of a JSON number; write it as a quoted string",
    });
  })
  .transform((value) => String(value).trim());

// Held to the form's own rules rather than a parallel set. An action that
// clears the import but not ProposalFormSchema would leave Publish disabled
// with nothing on screen to explain why, since action rows show no errors.
const recipient = z.string().trim().pipe(addressOrEnsSchema);
const tokenAddress = z.string().trim().pipe(strictAddressSchema);
const amount = numericString.pipe(positiveDecimalAmountSchema);

const EthTransferImportSchema = z.object({
  type: z.literal("eth-transfer"),
  recipient,
  amount,
});

const Erc20TransferImportSchema = z.object({
  type: z.literal("erc20-transfer"),
  recipient,
  tokenAddress,
  amount,
  // Optional: read from the token contract at import time. A supplied value is
  // treated as an assertion and checked, never trusted.
  decimals: z.number().int().nonnegative().optional(),
});

// `abi` stays `unknown` here so a malformed ABI produces a readable message
// from the outer superRefine instead of a wall of zod union errors. The
// function/calldata cross-field rules live there too, keeping this a plain
// ZodObject so the discriminated union below accepts it.
const CustomImportSchema = z.object({
  type: z.literal("custom"),
  contractAddress: z.string().trim().pipe(addressOrEnsSchema),
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

/**
 * Every parameter needs a string `type` all the way down: `parseArrayType`
 * calls `.match` on it, so a bare `{}` in `inputs` throws a TypeError out of
 * the argument walk below rather than reporting a bad paste.
 */
const isWellFormedParam = (param: unknown): boolean => {
  if (typeof param !== "object" || param === null) return false;
  if (typeof (param as { type?: unknown }).type !== "string") return false;
  const components = (param as { components?: unknown }).components;
  if (components === undefined) return true;
  return Array.isArray(components) && components.every(isWellFormedParam);
};

/**
 * `parseAbiStrict` only guarantees each entry has a string `type`, so a
 * `{ "type": "function" }` with no name, or one whose `inputs` hold empty
 * objects, survives it. viem's formatters and our own argument walk both
 * assume the full shape and throw on the way past.
 */
const isWellFormedFunction = (item: Abi[number]): item is AbiFunction => {
  if (item.type !== "function") return false;
  if (typeof (item as { name?: unknown }).name !== "string") return false;
  const inputs = (item as { inputs?: unknown }).inputs;
  return Array.isArray(inputs) && inputs.every(isWellFormedParam);
};

/** Mirrors argTree's own notion: these args are stored as JSON, not scalars. */
const isCompositeType = (type: string): boolean =>
  parseArrayType(type) !== null || type.startsWith("tuple");

/** Never throws: an exotic input type still reaches viem's formatter. */
const signatureOf = (fn: AbiFunction): string | null => {
  try {
    return toFunctionSignature(fn);
  } catch {
    return null;
  }
};

/**
 * Checks that an ABI-backed call is actually encodable, so the failure lands on
 * the paste instead of on `encodeActions` while the user is publishing: there,
 * a missing function throws outright and a wrong argument count blows up inside
 * viem. Matching mirrors encodeActions (full signature or bare name) so both
 * sides resolve the same overload, and each argument is held to the same
 * `isArgComplete` bar the custom-action modal uses to release its Confirm.
 */
const checkAbiCall = (
  ctx: z.RefinementCtx,
  index: number,
  abi: Abi,
  functionName: string,
  args: string[],
) => {
  // Rejected wholesale rather than skipped: the ABI is stored on the action as
  // pasted, and encodeActions walks the same array at publish time.
  if (
    abi.some((item) => item.type === "function" && !isWellFormedFunction(item))
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'has a "function" entry without a name or inputs',
      path: ["actions", index, "abi"],
    });
    return;
  }

  const fn = abi
    .filter(isWellFormedFunction)
    .find(
      (item) =>
        signatureOf(item) === functionName || item.name === functionName,
    );

  if (!fn) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `"${functionName}" is not a function in this action's abi`,
      path: ["actions", index, "functionName"],
    });
    return;
  }

  if (args.length !== fn.inputs.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${signatureOf(fn) ?? fn.name} takes ${fn.inputs.length}, got ${args.length}`,
      path: ["actions", index, "args"],
    });
    return;
  }

  // Arrays and tuples are stored as JSON strings. `storageToArg` degrades a
  // malformed one to an empty container, which `isArgComplete` then accepts as
  // a complete dynamic array, so the paste lands and `encodeActions` throws at
  // publish when it JSON.parses the original text. Check the raw string first.
  const malformed = fn.inputs.flatMap((input, i) => {
    if (!isCompositeType(input.type)) return [];
    try {
      return Array.isArray(JSON.parse(args[i])) ? [] : [i];
    } catch {
      return [i];
    }
  });
  if (malformed.length > 0) {
    malformed.forEach((i) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `must be a JSON array for ${fn.inputs[i].type}`,
        path: ["actions", index, "args", i],
      });
    });
    return;
  }

  const trees = argsToTrees(fn.inputs, args);
  fn.inputs.forEach((input, i) => {
    if (isArgComplete(input, trees[i] ?? buildEmpty(input))) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `is not a valid ${input.type}`,
      path: ["actions", index, "args", i],
    });
  });
};

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

      // Same rule as the custom-action modal. Without it a string like
      // "transfer(1)" satisfies ProposalFormSchema (which only checks that
      // calldata is non-empty), the form goes publishable, and encodeActions
      // casts it straight to Hex, so the paste only fails once the user is
      // already signing.
      if (
        hasCalldata &&
        !(isHex(action.calldata!) && action.calldata!.length % 2 === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "must be 0x-prefixed hex with an even number of characters",
          path: ["actions", index, "calldata"],
        });
      }

      // encodeActions runs BigInt(value), which takes decimal or 0x hex and
      // throws on anything else ("1e18" being the easy mistake).
      if (
        action.value !== undefined &&
        !/^(\d+|0x[0-9a-fA-F]+)$/.test(action.value)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "must be a whole number of wei",
          path: ["actions", index, "value"],
        });
      }

      const abi = action.abi === undefined ? null : parseAbiStrict(action.abi);

      if (action.abi !== undefined && abi === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "must be an array of ABI items",
          path: ["actions", index, "abi"],
        });
      }

      // Raw calldata wins in encodeActions, which returns before it ever walks
      // the ABI, so the call is only checked when there is none.
      if (hasCalldata || !hasFunctionName) return;

      if (action.abi === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'is required when "functionName" is used',
          path: ["actions", index, "abi"],
        });
        return;
      }
      if (abi === null) return;

      checkAbiCall(ctx, index, abi, action.functionName!, action.args ?? []);
    });
  });

type ImportedAction = z.infer<typeof ActionImportSchema>;

const toPendingAction = (action: ImportedAction): PendingAction => {
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
 * on-chain transaction) and lenient about everything else. ERC-20 decimals are
 * the one thing it can't settle offline; see `resolveImportedDecimals`.
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
    value: {
      title,
      discussionUrl,
      body,
      actions: actions?.map(toPendingAction),
    },
  };
};
