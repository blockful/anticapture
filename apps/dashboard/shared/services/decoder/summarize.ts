import { getDetector } from "@/shared/services/decoder/multicall/detectors";
import { humanizeEtherValue } from "@/shared/services/decoder/humanize/tokenAmount";
import type {
  DecodedCall,
  DecodedParam,
} from "@/shared/services/decoder/types";

const shortAddress = (address: string): string =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

// Positions come from the canonical signature the template is keyed by, so
// they hold for every ABI variant. Name-based lookup broke on real contracts:
// USDT's verified ABI declares transfer(address _to, uint256 _value).
const paramAt = (node: DecodedCall, index: number): DecodedParam | undefined =>
  node.params[index];

/** The amount as the reader will see it: enriched token text when available. */
const amountText = (param: DecodedParam | undefined): string => {
  if (!param) return "an unknown amount";
  if (param.humanized?.kind === "tokenAmount") return param.humanized.text;
  const grouped = param.humanized?.text ?? param.value;
  return `${grouped} (raw units)`;
};

const addressText = (param: DecodedParam | undefined): string =>
  param ? shortAddress(param.value) : "an unknown address";

type Template = (node: DecodedCall) => string | null;

// approve/transferFrom are shared between ERC-20 and ERC-721; a param the
// resolved ABI names as a token ID flips the sentence to NFT phrasing.
// Leading underscores are stripped so `_tokenId` counts too.
const tokenIdParam = (node: DecodedCall): DecodedParam | undefined =>
  node.params.find((param) =>
    /tokenid|^id$/i.test(param.name.replace(/^_+/, "")),
  );

const TEMPLATES: Record<string, Template> = {
  "transfer(address,uint256)": (node) =>
    `Transfers ${amountText(paramAt(node, 1))} to ${addressText(paramAt(node, 0))}.`,
  "approve(address,uint256)": (node) => {
    const tokenId = tokenIdParam(node);
    if (tokenId) {
      return `Approves ${addressText(paramAt(node, 0))} to manage token #${tokenId.value}.`;
    }
    return `Approves ${addressText(paramAt(node, 0))} to spend ${amountText(paramAt(node, 1))}.`;
  },
  "transferFrom(address,address,uint256)": (node) => {
    const tokenId = tokenIdParam(node);
    if (tokenId) {
      return `Transfers token #${tokenId.value} from ${addressText(paramAt(node, 0))} to ${addressText(paramAt(node, 1))}.`;
    }
    return `Transfers ${amountText(paramAt(node, 2))} from ${addressText(paramAt(node, 0))} to ${addressText(paramAt(node, 1))}.`;
  },
  "delegate(address)": (node) =>
    `Delegates the caller's voting power to ${addressText(paramAt(node, 0))}.`,
  "safeTransferFrom(address,address,uint256)": (node) =>
    `Transfers token #${paramAt(node, 2)?.value ?? "?"} from ${addressText(paramAt(node, 0))} to ${addressText(paramAt(node, 1))}.`,
  "safeTransferFrom(address,address,uint256,uint256,bytes)": (node) =>
    `Transfers ${paramAt(node, 3)?.value ?? "?"} of token #${paramAt(node, 2)?.value ?? "?"} from ${addressText(paramAt(node, 0))} to ${addressText(paramAt(node, 1))}.`,
  "updateDelay(uint256)": (node) => {
    const delay = paramAt(node, 0);
    const text = delay?.humanized?.text ?? `${delay?.value ?? "?"} seconds`;
    return `Updates the timelock delay to ${text}.`;
  },
};

/** How many distinct inner function names a batch summary spells out. */
const MAX_LISTED_SUBCALLS = 3;

/**
 * A batch may mark a call as tolerated-failure, and then nothing the sentence
 * describes is guaranteed: the summary has to say so, or a reader takes an
 * optional transfer for a certain one.
 */
const MAY_FAIL_SUFFIX = " (may fail)";

/**
 * What a batch listing must say about a child beyond its name: a delegatecall
 * does not act on the contract it names, and a tolerated-failure call may not
 * act at all.
 */
const qualifiers = (call: DecodedCall): string => {
  const notes: string[] = [];
  if (call.operation === "delegatecall") notes.push("delegatecall");
  if (call.mayFail) notes.push("may fail");
  return notes.length > 0 ? ` (${notes.join(", ")})` : "";
};

/** Short noun for a subcall in a batch listing: its function, or what moves. */
const subcallNoun = (call: DecodedCall): string => {
  const suffix = qualifiers(call);
  if (call.functionName) {
    if (!call.subcalls?.length) return `${call.functionName}${suffix}`;
    const inner = call.subcallCount ?? call.subcalls.length;
    return `${call.functionName} (${inner} ${inner === 1 ? "call" : "calls"})${suffix}`;
  }
  if (call.value && call.value > 0n) return `ETH transfer${suffix}`;
  return call.selector
    ? `selector ${call.selector}${suffix}`
    : `empty call${suffix}`;
};

/**
 * What a wrapper carries, so "Executes 1 call." becomes "Executes 1 call:
 * transfers 25,000 USDC to 0x1234…abcd." A single decoded child lends its
 * whole sentence; several children are listed by function name. Children the
 * node budget dropped stay uncounted here (the count itself already says so).
 */
const describeSubcalls = (
  subcalls: NonNullable<DecodedCall["subcalls"]>,
  count: number,
): string | null => {
  if (subcalls.length === 0) return null;
  if (count === 1) {
    const [child] = subcalls;
    // A nested wrapper's own sentence would chain "Executes 1 call: executes
    // 2 calls: …"; naming it with its arity reads better. A delegatecall child
    // needs no special case: its own sentence already says "delegatecalls X",
    // which is exactly what must be repeated here instead of an effect.
    if (child.summary && !child.subcalls?.length) {
      const sentence = child.summary.replace(/\.$/, "");
      const lowered = sentence.charAt(0).toLowerCase() + sentence.slice(1);
      return child.mayFail ? `${lowered}${MAY_FAIL_SUFFIX}` : lowered;
    }
    const target = child.target ? ` on ${shortAddress(child.target)}` : "";
    return `${subcallNoun(child)}${target}`;
  }
  const names = [...new Set(subcalls.map(subcallNoun))];
  const listed = names.slice(0, MAX_LISTED_SUBCALLS);
  // When the node budget dropped children, the names are a sample of the
  // batch and cannot claim an exact remainder. The leading count is the one
  // that speaks for the whole batch.
  if (subcalls.length < count) return `${listed.join(", ")}, …`;
  const rest = names.length - listed.length;
  return rest > 0 ? `${listed.join(", ")}, +${rest} more` : listed.join(", ");
};

/**
 * What a delegatecall leaf actually does. The target's code runs against the
 * caller's own state, so no effect template may speak for it: "Transfers
 * 25,000 USDC" would name a ledger the call never writes to.
 */
const delegatecallSentence = (node: DecodedCall): string => {
  const where = node.target ? shortAddress(node.target) : "an unknown address";
  const what =
    node.functionName ??
    (node.selector ? `selector ${node.selector}` : "no calldata");
  return `Delegatecalls ${where} (${what}).`;
};

/**
 * Deterministic one-sentence effect summary for known functions. Unknown
 * signatures return null and the UI falls back to showing the signature.
 */
export const summarize = (node: DecodedCall): string | null => {
  const isDelegatecall = node.operation === "delegatecall";

  // Multicall wrappers summarize by what they carry, which can exceed what
  // the node budget managed to decode. This comes FIRST, before any
  // delegatecall handling: what a batch holds is structural and stays true
  // however the parent invoked it, and the canonical Safe batch is a
  // delegatecall into MultiSend, so letting the operation swallow the
  // sentence would hide the entire transaction behind one address.
  const detector = node.selector === null ? null : getDetector(node.selector);
  if (detector && node.subcalls !== undefined) {
    const count = node.subcallCount ?? node.subcalls.length;
    const noun = count === 1 ? "call" : "calls";
    const mode = isDelegatecall ? " (delegatecall)" : "";
    const detail = describeSubcalls(node.subcalls, count);
    return detail
      ? `${detector.verb} ${count} ${noun}${mode}: ${detail}.`
      : `${detector.verb} ${count} ${noun}${mode}.`;
  }

  if (isDelegatecall) return delegatecallSentence(node);

  // Plain ETH transfer: no calldata, only value.
  if (node.selector === null) {
    if (node.value && node.value > 0n) {
      const ether = humanizeEtherValue(node.value).text;
      const to = node.target ? ` to ${shortAddress(node.target)}` : "";
      return `Transfers ${ether}${to}.`;
    }
    return null;
  }

  if (!node.signature) return null;
  const template = TEMPLATES[node.signature];
  return template ? template(node) : null;
};
