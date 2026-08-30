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
import { getDetector } from "@/shared/services/decoder/multicall/detectors";
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

/** Params of the known ERC20 functions that are amounts of the call target. */
const TOKEN_AMOUNT_PARAM: Record<string, number> = {
  "transfer(address,uint256)": 1,
  "approve(address,uint256)": 1,
  "transferFrom(address,address,uint256)": 2,
};

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
    if (amountIndex !== undefined && node.params[amountIndex]) {
      node.params[amountIndex].tokenHint = { token: input.target };
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
    node.subcalls = [];
    for (const [index, subcall] of extracted.entries()) {
      if (budget.nodesLeft <= 0) {
        node.warnings.push({
          code: "size-limit",
          message: `Stopped unpacking after ${opts.maxNodes} nested calls; the rest stay raw in the parameters above.`,
        });
        break;
      }
      budget.nodesLeft -= 1;
      if (depth + 1 > opts.maxDepth) {
        node.subcalls.push({
          index,
          chainId: input.chainId,
          target: subcall.target,
          value: subcall.value,
          selector: bestEffortSelector(subcall.calldata),
          abiSource: "none",
          params: [],
          raw: subcall.calldata,
          depth: depth + 1,
          warnings: [
            {
              code: "depth-limit",
              message: `Nesting deeper than ${opts.maxDepth} levels is left raw.`,
            },
          ],
          summary: null,
        });
        continue;
      }
      const child = await decodeNode(
        {
          chainId: input.chainId,
          target: subcall.target,
          calldata: subcall.calldata,
          value: subcall.value,
        },
        resolveAbi,
        opts,
        depth + 1,
        budget,
      );
      node.subcalls.push({ ...child, index });
    }
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
