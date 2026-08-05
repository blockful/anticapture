import { z } from "zod";

import {
  strictAddressSchema,
  type ProposalFormValues,
} from "@/features/create-proposal/schema";
import { parseAbiStrict } from "@/features/create-proposal/utils/fetchAbi";
import {
  convertImportedArg,
  convertUntypedArg,
  type ImportedArgIssue,
} from "@/features/create-proposal/utils/importedArgs";
import {
  formatJsonPath,
  lineFromParseError,
  scanJsonNumbers,
} from "@/features/create-proposal/utils/scanJsonSource";
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

/**
 * One thing wrong with the document, located precisely enough to fix.
 *
 * The path is the document's own path, not a paraphrase, so a problem inside a
 * tuple reads `actions[9].args[0].durations.total`. The line and the literal come
 * from the raw text, because neither survives `JSON.parse`.
 */
export type ImportIssue = {
  path: (string | number)[];
  message: string;
  /** 1-based, when the text could be walked. */
  line?: number;
  /** The figure as written, when the value was an unquoted number. */
  numberLiteral?: string;
};

export type ParseProposalJsonResult =
  | { ok: true; value: ParsedProposalJson }
  | { ok: false; issues: ImportIssue[] };

/*
 * This file checks what reading a document can get wrong. Whether an action is
 * publishable belongs to `ProposalFormSchema` via `customActionIssues`, so a pasted
 * action and a hand-built one are held to one standard. What stays here is what the
 * form can't see: JSON's lossiness with numbers, the translation from a document's
 * arg shapes into the form's, an ETH value the form can't display, and ERC-20
 * decimals only the token contract can settle.
 */

/**
 * Every figure that reaches the chain has to arrive quoted. A double can't hold every
 * decimal literal, and `JSON.parse` runs first: `1000000000000000001` arrives as
 * `...000` and `1.000000000000000001` as plain `1`, by which point the original text
 * is gone and a rounded figure is indistinguishable from one that was always round.
 * `decimals` stays a number: small, exact, and checked against the contract anyway.
 */
const quotedFigure = z
  .string({
    invalid_type_error:
      "must be quoted: a JSON number can silently change the value",
  })
  .trim();

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
  // Deliberately unconstrained here. An arg's legal shape depends on the type
  // its ABI declares: a string for most, a real boolean for `bool`, a real
  // array or keyed object for a composite, so it can only be judged once the
  // function is resolved. `convertImportedArg` does that, below.
  args: z.array(z.unknown()).optional(),
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

// Unknown keys are stripped rather than rejected, so a saved draft (which
// carries `id`, `daoId`, timestamps) can be pasted in as-is.
const ProposalJsonSchema = z.object({
  title: z.string().optional(),
  discussionUrl: z.string().optional(),
  body: z.string().optional(),
  actions: z.array(ActionImportSchema).optional(),
});

type ImportedAction = z.infer<typeof ActionImportSchema>;
type ImportedCustomAction = Extract<ImportedAction, { type: "custom" }>;

/**
 * Converts one custom action's args, and reports what the ABI says about them.
 *
 * The function is resolved once, here, and used for both jobs: deciding each
 * arg's legal shape and storing the full signature. A name that doesn't resolve
 * isn't reported, because that belongs to the form on the action's own row, but its
 * args still have to be stored, so they go through the ABI-less conversion.
 */
const convertCustomAction = (
  action: ImportedCustomAction,
  index: number,
): { action: PendingAction; issues: ImportIssue[] } => {
  const abi =
    action.abi === undefined ? [] : [...(parseAbiStrict(action.abi) ?? [])];
  const pastedName = action.functionName ?? "";
  const lookup = pastedName ? findAbiFunction(abi, pastedName) : undefined;
  const fn = lookup?.kind === "found" ? lookup.fn : undefined;

  // A bare name is accepted, but stored as the full signature: the edit modal
  // matches its function select on signatures alone, so a bare name would leave
  // an imported row unable to hydrate its function or its args.
  const functionName = fn ? (signatureOf(fn) ?? pastedName) : pastedName;

  const supplied = action.args ?? [];
  const issues: ImportIssue[] = [];
  const args: string[] = [];

  // Walk the args the document supplied, not the ABI's inputs: a count mismatch
  // is the form's to report (it says which signature expected how many), and
  // dropping the extras here would hide it.
  supplied.forEach((value, argIndex) => {
    const input = fn?.inputs[argIndex];
    const result = input
      ? convertImportedArg(input, value)
      : convertUntypedArg(value);

    if (result.ok) {
      args.push(result.storage);
      return;
    }
    // Keep the slot filled so later args stay at their own indexes.
    args.push("");
    issues.push(
      ...result.issues.map((issue: ImportedArgIssue) => ({
        path: ["actions", index, "args", argIndex, ...issue.path],
        message: issue.message,
      })),
    );
  });

  return {
    action: {
      type: "custom",
      contractAddress: action.contractAddress,
      abi,
      functionName,
      args,
      ...(action.calldata ? { calldata: action.calldata } : {}),
    },
    issues,
  };
};

/** Everything about an action that the document itself can get wrong. */
const convertAction = (
  action: ImportedAction,
  index: number,
): { action: PendingAction; issues: ImportIssue[] } => {
  if (action.type !== "custom") return { action, issues: [] };

  const issues: ImportIssue[] = [];

  // Nothing in the form supports an ETH value: the custom-action form has no
  // field for one and the action row doesn't display it. Accepting one leaves
  // funds attached to a call the author can neither see nor clear.
  if (action.value !== undefined) {
    issues.push({
      path: ["actions", index, "value"],
      message:
        "isn't supported yet: nothing in the form can show or clear an ETH value, so it can't be imported",
    });
  }

  if (action.abi !== undefined && parseAbiStrict(action.abi) === null) {
    issues.push({
      path: ["actions", index, "abi"],
      message: "must be an array of ABI items",
    });
  }

  const converted = convertCustomAction(action, index);
  return { action: converted.action, issues: [...issues, ...converted.issues] };
};

/** `actions[1].args[0]: …`, readable enough to fix the paste. */
export const formatImportIssue = (issue: ImportIssue): string => {
  const path = formatJsonPath(issue.path);
  return path ? `${path}: ${issue.message}` : issue.message;
};

/** Parses a pasted proposal document into form values. */
export const parseProposalJson = (text: string): ParseProposalJsonResult => {
  // Deliberately not trimmed: every line number below counts from the start of
  // what the user actually pasted, and trimming a leading blank line would shift
  // all of them by one.
  if (!text.trim()) {
    return {
      ok: false,
      issues: [{ path: [], message: "Paste the proposal JSON first." }],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      issues: [
        {
          path: [],
          message:
            "This isn't valid JSON. Check for a missing comma, quote, or bracket.",
          line: lineFromParseError(text, error),
        },
      ],
    };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      issues: [
        {
          path: [],
          message:
            'Expected a JSON object with "title", "discussionUrl", "body" or "actions".',
        },
      ],
    };
  }

  const numbers = scanJsonNumbers(text);
  const locate = (issue: ImportIssue): ImportIssue => {
    const source = numbers.get(formatJsonPath(issue.path));
    return source
      ? { ...issue, line: source.line, numberLiteral: source.literal }
      : issue;
  };

  const result = ProposalJsonSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      issues: result.error.issues.map((issue) =>
        locate({ path: [...issue.path], message: issue.message }),
      ),
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
      issues: [
        {
          path: [],
          message:
            'No known fields found. Use "title", "discussionUrl", "body" or "actions".',
        },
      ],
    };
  }

  const converted = actions?.map(convertAction);
  const issues = converted?.flatMap((c) => c.issues) ?? [];
  if (issues.length > 0) {
    return { ok: false, issues: issues.map(locate) };
  }

  return {
    ok: true,
    value: {
      title,
      discussionUrl,
      body,
      actions: converted?.map((c) => c.action),
    },
  };
};
