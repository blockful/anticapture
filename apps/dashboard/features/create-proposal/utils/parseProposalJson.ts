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
import { parseAbiStrict } from "@/shared/services/decoder/abi/etherscan";
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

/** An ERC-20 transfer before its decimals are confirmed against the token. A pasted
 *  `decimals` reaches `parseUnits`, so believing it would let "1 USDC" encode as
 *  1e18 base units while the row still reads 1. */
export type PendingErc20Transfer = Omit<Erc20FormAction, "decimals"> & {
  decimals?: number;
};

export type PendingAction =
  | Exclude<FormAction, { type: "erc20-transfer" }>
  | PendingErc20Transfer;

export type ParsedProposalJson = {
  title?: string;
  discussionUrl?: string;
  body?: string;
  actions?: PendingAction[];
};

export type ImportIssue = Issue & {
  line?: number;
};

export type ParseProposalJsonResult =
  | { ok: true; value: ParsedProposalJson }
  | { ok: false; issues: ImportIssue[] };

/* Three steps, and only the first two are this file's own: transport (which keys,
 * which JSON kind), translation (arg shapes into what the form stores), then rules —
 * which are `schema.ts`'s, run rather than restated. The import used to restate a
 * subset, so a paste could be accepted here and then sit on the form with Publish
 * disabled and nothing on screen explaining why. */

/** Every figure is read as the text it was written as, so text is all this needs. */
const documentText = z.string({ invalid_type_error: "must be text" });

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
  decimals: documentDecimals.optional(),
});

const CustomTransport = z.object({
  type: z.literal("custom"),
  contractAddress: documentText.trim(),
  abi: z.unknown().optional(),
  functionName: documentText.trim().optional(),
  args: z.array(z.unknown()).optional(),
  calldata: documentText.trim().optional(),
  value: z.unknown().optional(),
});

const ActionTransport = z.discriminatedUnion("type", [
  EthTransferTransport,
  Erc20TransferTransport,
  CustomTransport,
]);

// Unknown keys are stripped rather than rejected, so a saved draft (carrying `id`,
// `daoId`, timestamps) pastes in unchanged.
const ProposalJsonTransport = z.object({
  title: documentText.optional(),
  discussionUrl: documentText.optional(),
  body: documentText.optional(),
  actions: z.array(ActionTransport).optional(),
});

type ImportedAction = z.infer<typeof ActionTransport>;
type ImportedCustomAction = Extract<ImportedAction, { type: "custom" }>;

const translateCustomAction = (
  action: ImportedCustomAction,
  index: number,
): { action: PendingAction; issues: ImportIssue[] } => {
  const abi =
    action.abi === undefined ? [] : [...(parseAbiStrict(action.abi) ?? [])];
  const pastedName = action.functionName ?? "";
  const lookup = pastedName ? findAbiFunction(abi, pastedName) : undefined;
  const fn = lookup?.kind === "found" ? lookup.fn : undefined;

  // A bare name is accepted but stored as the full signature: the edit modal matches
  // its select on signatures alone, so a bare name would leave an imported row unable
  // to hydrate its function or its args.
  const functionName = fn ? (signatureOf(fn) ?? pastedName) : pastedName;

  const supplied = action.args ?? [];
  const issues: ImportIssue[] = [];
  const args: string[] = [];

  // The args the document supplied, not the ABI's inputs: a count mismatch is
  // `customActionIssues`' to report, and dropping the extras here would hide it.
  supplied.forEach((value, argIndex) => {
    const input = fn?.inputs[argIndex];
    const result = input
      ? convertImportedArg(input, value)
      : convertUntypedArg(value);

    if (result.ok) {
      args.push(result.storage);
      return;
    }
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

const translateAction = (
  action: ImportedAction,
  index: number,
): { action: PendingAction; issues: ImportIssue[] } => {
  if (action.type !== "custom") return { action, issues: [] };

  const issues: ImportIssue[] = [];

  // Nothing in the form shows or clears an ETH value. Refused by name rather than
  // stripped as an unknown key: dropping it quietly would publish 0 wei instead of
  // what the document asked for.
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

/** Completeness is deliberately not checked: a document may legitimately carry
 *  actions and no title, and the author fills the rest in on the form. */
const ruleIssues = (action: PendingAction, index: number): ImportIssue[] => {
  const issues = issuesFor(PendingProposalActionSchema, action, [
    "actions",
    index,
  ]);
  if (issues.length > 0) return issues;

  if (action.type === "eth-transfer") {
    const precision = amountPrecisionError(action.amount, ETH_DECIMALS);
    return precision
      ? [{ path: ["actions", index, "amount"], message: precision }]
      : [];
  }
  return [];
};

export const formatImportIssue = (issue: ImportIssue): string => {
  const path = formatJsonPath(issue.path);
  return path ? `${path}: ${issue.message}` : issue.message;
};

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

  // Before the rules: a value that could not even be rewritten in the form's shape
  // would fail every rule downstream, in vaguer words.
  const translationIssues = translated?.flatMap((t) => t.issues) ?? [];
  if (translationIssues.length > 0) {
    return { ok: false, issues: locate(translationIssues) };
  }

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
