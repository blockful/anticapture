import { z } from "zod";

import {
  strictAddressSchema,
  type ProposalFormValues,
} from "@/features/create-proposal/schema";
import { parseArrayType } from "@/features/create-proposal/utils/argTree";
import { parseAbiStrict } from "@/features/create-proposal/utils/fetchAbi";
import {
  findAbiFunction,
  signatureOf,
} from "@/features/create-proposal/utils/validateCustomAction";

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

/*
 * This file checks what reading a document can get wrong, and what a document
 * can assert that nothing downstream would question.
 *
 * Whether an action is publishable belongs to `ProposalFormSchema`, through
 * `customActionIssues`, so a pasted action and a hand-built one are held to one
 * standard and a bad one reports on its row instead of being refused at the
 * door. What stays here is the part the form can't see: JSON's own lossiness
 * with numbers, an ETH value nothing in the form can display, and ERC-20
 * decimals only the token contract can settle.
 */

/**
 * Every figure that reaches the chain has to arrive quoted.
 *
 * A JSON number is not the number that was written. `JSON.parse` runs before
 * anything here and a double can't hold every decimal literal:
 * `1000000000000000001` arrives as `1000000000000000000`,
 * `0.123456789123456789` as `0.12345678912345678`, and
 * `1.000000000000000001` as plain `1`. By then the original text is gone, so no
 * inspection of the parsed value can tell a rounded figure from one that was
 * always round: that last case is indistinguishable from someone writing `1`.
 * Guessing would mean silently moving a different amount of money than the
 * document asked for, so numbers are refused outright.
 *
 * `decimals` stays a number: it is small, exact, and checked against the token
 * contract anyway.
 */
const quotedFigure = z
  .string({
    invalid_type_error:
      "must be quoted: a JSON number can silently change the value",
  })
  .trim();

/** The same rule without the trim: normalizing scalar text is argTree's job. */
const quotedArg = z.string({
  invalid_type_error:
    "must be quoted: a JSON number can silently change the value",
});

const EthTransferImportSchema = z.object({
  type: z.literal("eth-transfer"),
  recipient: z.string().trim(),
  amount: quotedFigure,
});

const Erc20TransferImportSchema = z.object({
  type: z.literal("erc20-transfer"),
  recipient: z.string().trim(),
  // Strict here, unlike the other addresses: this one isn't only stored, it's
  // called, and the decimals lookup has nothing to read from an ENS name.
  tokenAddress: z.string().trim().pipe(strictAddressSchema),
  amount: quotedFigure,
  // Optional: read from the token contract at import time. A supplied value is
  // treated as an assertion and checked, never trusted.
  decimals: z.number().int().nonnegative().optional(),
});

const CustomImportSchema = z.object({
  type: z.literal("custom"),
  contractAddress: z.string().trim(),
  abi: z.unknown().optional(),
  functionName: z.string().trim().optional(),
  args: z.array(quotedArg).optional(),
  calldata: z.string().trim().optional(),
  // Kept in the shape only so it can be refused by name. Unknown keys are
  // stripped, and silently dropping a declared ETH value would publish 0 wei
  // instead of what the document asked for.
  value: z.unknown().optional(),
});

const ActionImportSchema = z.discriminatedUnion("type", [
  EthTransferImportSchema,
  Erc20TransferImportSchema,
  CustomImportSchema,
]);

/** Mirrors argTree: these args are stored as JSON, not as scalars. */
const isCompositeType = (type: string): boolean =>
  parseArrayType(type) !== null || type.startsWith("tuple");

/**
 * The quoting rule one level down. A composite arg is itself JSON, so
 * `"[1.000000000000000001]"` is already `[1]` by the time anything reads it, and
 * the stored text rounds the same way every time it is parsed again.
 */
const holdsUnquotedNumber = (value: unknown): boolean => {
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.some(holdsUnquotedNumber);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).some(holdsUnquotedNumber);
  }
  return false;
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

      // Nothing in the form supports an ETH value: the custom-action form has
      // no field for one and the action row doesn't display it. Accepting one
      // leaves funds attached to a call the author can neither see nor clear.
      if (action.value !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "isn't supported yet: nothing in the form can show or clear an ETH value, so it can't be imported",
          path: ["actions", index, "value"],
        });
      }

      if (action.abi === undefined) return;

      const abi = parseAbiStrict(action.abi);
      if (abi === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "must be an array of ABI items",
          path: ["actions", index, "abi"],
        });
        return;
      }

      // Which args are composite depends on the function, so the quoting rule
      // needs it resolved. Anything wrong with the call itself is the form's to
      // report, so a name that doesn't resolve just ends the check here.
      const lookup = action.functionName
        ? findAbiFunction(abi, action.functionName)
        : undefined;
      if (lookup?.kind !== "found") return;

      lookup.fn.inputs.forEach((input, i) => {
        const arg = action.args?.[i];
        if (arg === undefined || !isCompositeType(input.type)) return;

        let parsed: unknown;
        try {
          parsed = JSON.parse(arg);
        } catch {
          return; // malformed JSON is the form's to report
        }
        if (!holdsUnquotedNumber(parsed)) return;

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "must quote its numbers: a JSON number can silently change the value",
          path: ["actions", index, "args", i],
        });
      });
    });
  });

type ImportedAction = z.infer<typeof ActionImportSchema>;

const toPendingAction = (action: ImportedAction): PendingAction => {
  if (action.type !== "custom") return action;

  const abi =
    action.abi === undefined ? [] : [...(parseAbiStrict(action.abi) ?? [])];

  // A bare name is accepted, but stored as the full signature: the edit modal
  // matches its function select on signatures alone, so a bare name would leave
  // an imported row unable to hydrate its function or its args.
  const pastedName = action.functionName ?? "";
  const lookup = pastedName ? findAbiFunction(abi, pastedName) : undefined;
  const functionName =
    lookup?.kind === "found"
      ? (signatureOf(lookup.fn) ?? pastedName)
      : pastedName;

  return {
    type: "custom",
    contractAddress: action.contractAddress,
    abi,
    functionName,
    // Stored exactly as pasted: normalizing scalar text is argTree's job, on
    // the way to the encoder.
    args: action.args ?? [],
    ...(action.calldata ? { calldata: action.calldata } : {}),
  };
};

/** `actions[1].args[0]: …`, readable enough to fix the paste. */
const formatIssue = (issue: z.ZodIssue): string => {
  const path = issue.path.reduce<string>((acc, segment) => {
    if (typeof segment === "number") return `${acc}[${segment}]`;
    return acc ? `${acc}.${segment}` : String(segment);
  }, "");
  return path ? `${path}: ${issue.message}` : issue.message;
};

/** Parses a pasted proposal document into form values. */
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
