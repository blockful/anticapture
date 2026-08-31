import {
  decodeFunctionData,
  getAddress,
  type AbiFunction,
  type AbiParameter,
  type Address,
  type Hex,
} from "viem";

import type { AbiResolver } from "@/shared/services/decoder/abi/resolveAbi";
import { humanizeLeaf } from "@/shared/services/decoder/humanize";
import {
  getDetector,
  type ExtractedSubcall,
} from "@/shared/services/decoder/multicall/detectors";
import { summarize } from "@/shared/services/decoder/summarize";
import type {
  DecodedCall,
  DecodedParam,
} from "@/shared/services/decoder/types";
import {
  guessWords,
  looksLikeCalldata,
} from "@/shared/services/decoder/wordGuess";
import { shapeOf } from "@/shared/utils/paramShape";

export type DecodeInput = {
  chainId: number;
  target?: Address;
  /** Unvalidated on purpose: the standalone tool pastes arbitrary text. */
  calldata: string;
  value?: bigint;
};

export type DecodeOptions = {
  /** Absolute recursion depth where unpacking stops. */
  maxDepth?: number;
  /** Calldata beyond this many bytes keeps only selector + raw. */
  maxBytes?: number;
  /** Total subcall nodes one decode may produce (fan-out guard). */
  maxNodes?: number;
  /** Root depth: lazy nested decodes continue from their parent's depth. */
  startDepth?: number;
};

const DEFAULTS = { maxDepth: 5, maxBytes: 131_072, maxNodes: 200 };

/** Independent batch children decode in parallel, gently: each may cost an
 *  Etherscan/OpenChain round trip and both services rate-limit. */
const SUBCALL_CONCURRENCY = 4;

/** Params of the known ERC20 functions that are amounts of the call target. */
const TOKEN_AMOUNT_PARAM: Record<string, number> = {
  "transfer(address,uint256)": 1,
  "approve(address,uint256)": 1,
  "transferFrom(address,address,uint256)": 2,
};

/**
 * `approve(address,uint256)` and `transferFrom(address,address,uint256)` are
 * shared between ERC-20 and ERC-721, where the uint is a token ID, not an
 * amount. When the resolved ABI names the param, that evidence decides; ID
 * names block the fungible-amount hint (and its decimals lookup).
 */
const NON_FUNGIBLE_PARAM_NAME = /tokenid|^id$/i;

const isHexString = (value: string): boolean =>
  /^0x[0-9a-fA-F]*$/.test(value) && value.length % 2 === 0;

const bestEffortSelector = (value: string): Hex | null =>
  /^0x[0-9a-fA-F]{8}/.test(value)
    ? (value.slice(0, 10).toLowerCase() as Hex)
    : null;

const leafValue = (type: string, value: unknown): string => {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (type === "address" && typeof value === "string") {
    try {
      return getAddress(value);
    } catch {
      return value;
    }
  }
  return typeof value === "string" ? value : String(value);
};

const buildParam = (
  param: AbiParameter,
  value: unknown,
  functionName: string | undefined,
  index: number,
): DecodedParam => {
  const shape = shapeOf(param);
  const name = param.name || `arg${index}`;

  if (shape.kind === "array") {
    const items = Array.isArray(value) ? value : [];
    return {
      name,
      type: param.type,
      value: `${items.length} ${items.length === 1 ? "item" : "items"}`,
      children: items.map((item, i) =>
        buildParam(
          { ...shape.element, name: `[${i}]` } as AbiParameter,
          item,
          functionName,
          i,
        ),
      ),
    };
  }

  if (shape.kind === "tuple") {
    // viem decodes named tuples to objects and unnamed ones to arrays.
    const record = (value ?? {}) as Record<string, unknown>;
    const positional = Array.isArray(value) ? value : null;
    return {
      name,
      type: param.type,
      value: `${shape.components.length} fields`,
      children: shape.components.map((component, i) =>
        buildParam(
          component,
          positional ? positional[i] : record[component.name ?? ""],
          functionName,
          i,
        ),
      ),
    };
  }

  const text = leafValue(shape.type, value);
  const decoded: DecodedParam = { name, type: shape.type, value: text };
  if (shape.type === "address") decoded.isAddress = true;
  if (shape.type === "bytes" && looksLikeCalldata(text)) {
    decoded.isCalldataLike = true;
  }
  const humanized = humanizeLeaf(
    { type: shape.type, name, functionName },
    value,
  );
  if (humanized) decoded.humanized = humanized;
  return decoded;
};

type Budget = { nodesLeft: number };

const decodeNode = async (
  input: DecodeInput,
  resolveAbi: AbiResolver,
  opts: Required<Omit<DecodeOptions, "startDepth">>,
  depth: number,
  budget: Budget,
): Promise<DecodedCall> => {
  const node: DecodedCall = {
    chainId: input.chainId,
    target: input.target,
    value: input.value,
    selector: null,
    abiSource: "none",
    params: [],
    raw: input.calldata.trim() as Hex,
    depth,
    warnings: [],
    summary: null,
  };
  const raw = node.raw as string;

  // 1. Malformed input: an error node that preserves the input verbatim.
  if (!isHexString(raw)) {
    node.selector = bestEffortSelector(raw);
    node.error =
      "Not valid calldata: expected 0x-prefixed hex with an even number of characters.";
    node.summary = summarize(node);
    return node;
  }

  const byteLength = (raw.length - 2) / 2;

  // 2. Empty calldata: a plain ETH transfer (or a no-op).
  if (byteLength === 0) {
    node.summary = summarize(node);
    return node;
  }

  // 3. Shorter than a selector: nothing to resolve against.
  if (byteLength < 4) {
    node.error = "Calldata is shorter than a 4-byte function selector.";
    return node;
  }

  node.selector = raw.slice(0, 10).toLowerCase() as Hex;

  // 4. Size guard: keep selector + raw, skip parameter decoding.
  if (byteLength > opts.maxBytes) {
    node.warnings.push({
      code: "size-limit",
      message: `Calldata is ${byteLength.toLocaleString("en-US")} bytes; parameters beyond ${opts.maxBytes.toLocaleString("en-US")} bytes are not decoded.`,
    });
    return node;
  }

  // 5. Resolve the function. The resolver owns the whole fallback chain,
  // including the known-selector table, so a target's verified ABI always
  // outranks the canonical signatures on 4-byte collisions.
  let fn: AbiFunction | null = null;
  const resolved = await resolveAbi({
    chainId: input.chainId,
    target: input.target,
    selector: node.selector,
    calldata: raw as Hex,
  });
  if (resolved) {
    fn = resolved.fn;
    node.abiSource = resolved.source;
    node.signature = resolved.signature;
    if (resolved.warning) node.warnings.push(resolved.warning);
  }

  // 6. No ABI anywhere: word-shape-guessed params, permanently flagged.
  if (!fn) {
    node.params = guessWords(raw as Hex);
    node.warnings.push({
      code: "guessed-types",
      message:
        "No ABI found for this call; types are guessed from the raw words.",
    });
    node.summary = summarize(node);
    return node;
  }

  const abiFn = fn;
  node.functionName = abiFn.name;

  // 7. Decode. A failure against a resolved ABI is an error state, never blank.
  let args: readonly unknown[];
  try {
    const decoded = decodeFunctionData({ abi: [abiFn], data: raw as Hex });
    args = (decoded.args ?? []) as readonly unknown[];
  } catch {
    node.error = `Couldn't decode this calldata against ${node.signature ?? "the resolved ABI"}.`;
    node.summary = summarize(node);
    return node;
  }

  node.params = abiFn.inputs.map((param, i) =>
    buildParam(param, args[i], abiFn.name, i),
  );

  if (input.target && node.signature !== undefined) {
    const amountIndex = TOKEN_AMOUNT_PARAM[node.signature];
    const amountParam = node.params[amountIndex];
    if (
      amountIndex !== undefined &&
      amountParam &&
      !NON_FUNGIBLE_PARAM_NAME.test(amountParam.name.replace(/^_+/, ""))
    ) {
      amountParam.tokenHint = { token: input.target };
    }
  }

  // 8. Multicall unpacking, bounded by depth and node budget. The detector
  // must match the RESOLVED signature, not just the selector: a target's own
  // ABI can resolve a colliding selector to an unrelated function whose args
  // would crash the wrapper's extractor.
  const detector = getDetector(node.selector);
  if (detector && node.signature === detector.signature) {
    if (detector.warningsFor) node.warnings.push(...detector.warningsFor(args));
    const extracted = detector.extract(args);

    // Budget and depth gating stay synchronous and deterministic; the actual
    // child decodes then run with bounded concurrency, since each unverified
    // child target can cost its own Etherscan/OpenChain round trip and a big
    // batch decoded serially would keep the card blank for many seconds.
    type Slot =
      | { index: number; node: DecodedCall }
      | { index: number; subcall: ExtractedSubcall };
    const slots: Slot[] = [];
    for (const [index, subcall] of extracted.entries()) {
      if (budget.nodesLeft <= 0) {
        node.warnings.push({
          code: "size-limit",
          message:
            "Nested-call budget exhausted; the remaining calls stay raw in the parameters above.",
        });
        break;
      }
      budget.nodesLeft -= 1;
      if (depth + 1 > opts.maxDepth) {
        slots.push({
          index,
          node: {
            chainId: input.chainId,
            target: subcall.target,
            value: subcall.value,
            selector: bestEffortSelector(subcall.calldata),
            abiSource: "none",
            params: [],
            raw: subcall.calldata,
            depth: depth + 1,
            warnings: [
              ...(subcall.warnings ?? []),
              {
                code: "depth-limit",
                message: `Nesting deeper than ${opts.maxDepth} levels is left raw.`,
              },
            ],
            summary: null,
          },
        });
        continue;
      }
      slots.push({ index, subcall });
    }

    // Descendant capacity is carved up deterministically BEFORE the workers
    // start: with a shared mutable budget, whichever network lookup finished
    // first would consume the remaining slots, and identical calldata could
    // expose different branches on different runs. Source order gets the
    // integer-division remainder, so earlier calls always win ties.
    const jobCount = slots.filter((slot) => "subcall" in slot).length;
    const remaining = budget.nodesLeft;
    budget.nodesLeft = 0;
    const base = jobCount > 0 ? Math.floor(remaining / jobCount) : 0;
    let extra = jobCount > 0 ? remaining % jobCount : 0;
    const shares = slots.map((slot) => {
      if (!("subcall" in slot)) return 0;
      const share = base + (extra > 0 ? 1 : 0);
      if (extra > 0) extra -= 1;
      return share;
    });
    const childBudgets = shares.map((share) => ({ nodesLeft: share }));

    const decoded = new Array<DecodedCall & { index: number }>(slots.length);
    let cursor = 0;
    const workers = Array.from(
      { length: Math.min(SUBCALL_CONCURRENCY, slots.length) },
      async () => {
        while (cursor < slots.length) {
          const position = cursor++;
          const slot = slots[position];
          if ("node" in slot) {
            decoded[position] = { ...slot.node, index: slot.index };
            continue;
          }
          const child = await decodeNode(
            {
              chainId: input.chainId,
              target: slot.subcall.target,
              calldata: slot.subcall.calldata,
              value: slot.subcall.value,
            },
            resolveAbi,
            opts,
            depth + 1,
            childBudgets[position],
          );
          decoded[position] = {
            ...child,
            warnings: [...(slot.subcall.warnings ?? []), ...child.warnings],
            index: slot.index,
          };
        }
      },
    );
    await Promise.all(workers);

    // Second pass: reclaim unused shares so maxNodes stays a TOTAL cap, not a
    // per-branch quota. Flat siblings leave their whole share untouched;
    // children that exhausted theirs are re-decoded sequentially in source
    // order (deterministic) with the pooled leftovers plus their original
    // share credited back, since the retry replaces their entire subtree.
    // Re-decoding is cheap: the resolver memoizes every fetch per instance.
    let pool = childBudgets.reduce((sum, child) => sum + child.nodesLeft, 0);
    for (let position = 0; position < slots.length; position++) {
      if (pool <= 0) break;
      const slot = slots[position];
      if (!("subcall" in slot)) continue;
      if (childBudgets[position].nodesLeft > 0) continue;
      const retryBudget = { nodesLeft: pool + shares[position] };
      const child = await decodeNode(
        {
          chainId: input.chainId,
          target: slot.subcall.target,
          calldata: slot.subcall.calldata,
          value: slot.subcall.value,
        },
        resolveAbi,
        opts,
        depth + 1,
        retryBudget,
      );
      decoded[position] = {
        ...child,
        warnings: [...(slot.subcall.warnings ?? []), ...child.warnings],
        index: slot.index,
      };
      // Whatever the retry did not use returns for the next truncated sibling.
      pool = retryBudget.nodesLeft;
    }

    // Hand unused capacity back to OUR parent: without this, every wrapper
    // child looks exhausted to its parent's reclaim pass and the budget leaks
    // one level at a time. The unallocated remainder matters too — a wrapper
    // with zero decodable children (an empty batch) never carved shares at
    // all, and discarding `remaining` there would starve its siblings.
    const allocated = shares.reduce((sum, share) => sum + share, 0);
    budget.nodesLeft = pool + (remaining - allocated);

    node.subcalls = decoded;
    node.subcallCount = extracted.length;
  }

  node.summary = summarize(node);
  return node;
};

/**
 * True when any node in the tree fell back past the ABI sources (guessed
 * words or a decode error). Callers use this to cache such results briefly
 * instead of forever: a transient Etherscan/OpenChain outage degrades to a
 * word-guess, and the real decode must be obtainable once the service is back.
 */
export const isDegradedDecode = (node: DecodedCall): boolean => {
  if (node.error !== undefined) return true;
  if (node.selector !== null && node.abiSource === "none") return true;
  // A known-table decode WITH a target may be standing in for a verified
  // lookup that transiently failed, so it stays refresh-eligible. Without a
  // target no verified ABI can ever exist and the canonical shape is final.
  if (node.abiSource === "known" && node.target !== undefined) return true;
  return node.subcalls?.some(isDegradedDecode) ?? false;
};

/**
 * Decodes calldata into a structured tree. Every path returns a DecodedCall
 * with `raw` preserved: malformed input, unknown ABIs and decode failures
 * degrade through word-guessing and error states, never to a blank result.
 */
export const decodeCalldata = (
  input: DecodeInput,
  resolveAbi: AbiResolver,
  opts?: DecodeOptions,
): Promise<DecodedCall> => {
  const { startDepth, ...limits } = opts ?? {};
  return decodeNode(
    input,
    resolveAbi,
    { ...DEFAULTS, ...limits },
    startDepth ?? 0,
    { nodesLeft: limits.maxNodes ?? DEFAULTS.maxNodes },
  );
};
