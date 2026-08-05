import { z } from "zod";

import {
  amountPrecisionError,
  bodySchema,
  discussionUrlSchema,
  ETH_DECIMALS,
  PendingProposalActionSchema,
  titleSchema,
  type ProposalFormValues,
} from "@/features/create-proposal/schema";
import { parseAbiStrict } from "@/features/create-proposal/utils/fetchAbi";
import {
  convertImportedArg,
  convertUntypedArg,
  type ImportedArgIssue,
} from "@/features/create-proposal/utils/importedArgs";
import type { Issue } from "@/features/create-proposal/utils/issues";
import {
  formatJsonPath,
  parseJsonDocument,
} from "@/features/create-proposal/utils/jsonSource";
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
 * tuple reads `actions[9].args[0].durations.total`. The line comes from the
 * syntax tree, which is why the document is read through `parseJsonDocument`
 * rather than `JSON.parse`.
 */
export type ImportIssue = Issue & {
  /** 1-based, when the value could be located in the text. */
  line?: number;
};

export type ParseProposalJsonResult =
  | { ok: true; value: ParsedProposalJson }
  | { ok: false; issues: ImportIssue[] };

/*
 * Reading a pasted proposal happens in three steps, and only the first two are
 * this file's own.
 *
 * 1. Transport — which keys the document carries and what JSON kind each holds.
 *    Unknown keys are stripped rather than rejected, so a saved draft (which
 *    carries `id`, `daoId`, timestamps) pastes in unchanged.
 * 2. Translation — a document's arg shapes rewritten as the form stores them, in
 *    `importedArgs`. Needs the ABI, so the function is resolved here.
 * 3. Rules — whether any of it is publishable. Not defined here: the schemas and
 *    `customActionIssues` in `schema.ts` are what the form itself runs, and they
 *    are called from `ruleIssues` below. The import used to restate a subset of
 *    them, which meant a paste could be accepted here and then sit on the form
 *    with Publish disabled and nothing on screen explaining why.
 */

/** Every figure in the document is read as the text it was written as, so text is
 *  all this needs to accept. */
const documentText = z.string({ invalid_type_error: "must be text" });

/** `decimals` is the one field the form wants as a number. */
const documentDecimals = z
  .string()
  .regex(/^\d+$/, "must be a whole number")
  .transform(Number);

const EthTransferTransport = z.object({
  type: z.literal("eth-transfer"),
  recipient: documentText.trim(),
  amount: documentText.trim(),
});

const Erc20TransferTransport = z.object({
  type: z.literal("erc20-transfer"),
  recipient: documentText.trim(),
  tokenAddress: documentText.trim(),
  amount: documentText.trim(),
  // Optional: read from the token contract at import time. A supplied value is
  // treated as an assertion and checked, never trusted.
  decimals: documentDecimals.optional(),
});

const CustomTransport = z.object({
  type: z.literal("custom"),
  contractAddress: documentText.trim(),
  abi: z.unknown().optional(),
  functionName: documentText.trim().optional(),
  // Deliberately unconstrained here. An arg's legal shape depends on the type
  // its ABI declares: text for most, a real boolean for `bool`, a real array or
  // keyed object for a composite, so it can only be judged once the function is
  // resolved. `convertImportedArg` does that, below.
  args: z.array(z.unknown()).optional(),
  calldata: documentText.trim().optional(),
  // Kept in the shape only so it can be refused by name. Unknown keys are
  // stripped, and silently dropping a declared ETH value would publish 0 wei
  // instead of what the document asked for.
  value: z.unknown().optional(),
});

const ActionTransport = z.discriminatedUnion("type", [
  EthTransferTransport,
  Erc20TransferTransport,
  CustomTransport,
]);

const ProposalJsonTransport = z.object({
  title: documentText.optional(),
  discussionUrl: documentText.optional(),
  body: documentText.optional(),
  actions: z.array(ActionTransport).optional(),
});

type ImportedAction = z.infer<typeof ActionTransport>;
type ImportedCustomAction = Extract<ImportedAction, { type: "custom" }>;

/**
 * Translates one custom action's args, and stores the full signature.
 *
 * The function is resolved once, here, and used for both jobs: deciding each
 * arg's legal shape and naming the function. A name that doesn't resolve isn't
 * reported here — `customActionIssues` says so, in the words the form uses — but
 * its args still have to be stored, so they go through the ABI-less translation.
 */
const translateCustomAction = (
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
  // is `customActionIssues`' to report (it says which signature expected how
  // many), and dropping the extras here would hide it.
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

/** Rewrites one action in the form's shape, reporting only what stops it from
 *  being representable at all. */
const translateAction = (
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

  const translated = translateCustomAction(action, index);
  return {
    action: translated.action,
    issues: [...issues, ...translated.issues],
  };
};

/** Runs one of the form's own schemas and re-roots its issues at `path`. */
const issuesFor = (
  schema: z.ZodTypeAny,
  value: unknown,
  path: (string | number)[],
): ImportIssue[] => {
  const result = schema.safeParse(value);
  if (result.success) return [];
  return result.error.issues.map((issue) => ({
    path: [...path, ...issue.path],
    message: issue.message,
  }));
};

/**
 * Holds a translated action to exactly what the form holds it to.
 *
 * `PendingProposalActionSchema` is the form's action schema with `decimals` left
 * open, and its `superRefine` counterpart, `customActionIssues`, is reached
 * through it. Completeness is deliberately not checked: a document may
 * legitimately carry actions and no title, and the author fills the rest in on
 * the form. That part stays with Publish.
 */
const ruleIssues = (action: PendingAction, index: number): ImportIssue[] => {
  const issues = issuesFor(PendingProposalActionSchema, action, [
    "actions",
    index,
  ]);
  if (issues.length > 0) return issues;

  // Known without asking a contract, unlike an ERC-20's, so it can be caught
  // here rather than at publish.
  if (action.type === "eth-transfer") {
    const precision = amountPrecisionError(action.amount, ETH_DECIMALS);
    return precision
      ? [{ path: ["actions", index, "amount"], message: precision }]
      : [];
  }
  return [];
};

/** `actions[1].args[0]: …`, readable enough to fix the paste. */
export const formatImportIssue = (issue: ImportIssue): string => {
  const path = formatJsonPath(issue.path);
  return path ? `${path}: ${issue.message}` : issue.message;
};

/** Parses a pasted proposal document into form values. */
export const parseProposalJson = (text: string): ParseProposalJsonResult => {
  if (!text.trim()) {
    return {
      ok: false,
      issues: [{ path: [], message: "Paste the proposal JSON first." }],
    };
  }

  const parsed = parseJsonDocument(text);
  if (!parsed.ok) {
    return {
      ok: false,
      issues: [
        {
          path: [],
          message:
            "This isn't valid JSON. Check for a missing comma, quote, or bracket.",
          line: parsed.line,
        },
      ],
    };
  }

  const { value: document, lineOf } = parsed.document;
  if (
    document === null ||
    typeof document !== "object" ||
    Array.isArray(document)
  ) {
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

  /** Every issue gets the line its value was written on, where there is one. */
  const locate = (issues: ImportIssue[]): ImportIssue[] =>
    issues.map((issue) => {
      const line = lineOf(issue.path);
      return line === undefined ? issue : { ...issue, line };
    });

  const result = ProposalJsonTransport.safeParse(document);
  if (!result.success) {
    return {
      ok: false,
      issues: locate(
        result.error.issues.map((issue) => ({
          path: [...issue.path],
          message: issue.message,
        })),
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

  const translated = actions?.map(translateAction);

  // Reported before the rules: a value that could not even be rewritten in the
  // form's shape would fail every rule downstream, in vaguer words.
  const translationIssues = translated?.flatMap((t) => t.issues) ?? [];
  if (translationIssues.length > 0) {
    return { ok: false, issues: locate(translationIssues) };
  }

  // The fields present, each held to the form's own schema for it.
  const issues: ImportIssue[] = [
    ...(title === undefined ? [] : issuesFor(titleSchema, title, ["title"])),
    ...(discussionUrl === undefined
      ? []
      : issuesFor(discussionUrlSchema, discussionUrl, ["discussionUrl"])),
    ...(body === undefined ? [] : issuesFor(bodySchema, body, ["body"])),
    ...(translated?.flatMap((t, index) => ruleIssues(t.action, index)) ?? []),
  ];
  if (issues.length > 0) return { ok: false, issues: locate(issues) };

  return {
    ok: true,
    value: {
      title,
      discussionUrl,
      body,
      actions: translated?.map((t) => t.action),
    },
  };
};
