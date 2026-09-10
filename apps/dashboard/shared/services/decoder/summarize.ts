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

/** Short noun for a subcall in a batch listing: its function, or what moves. */
const subcallNoun = (call: DecodedCall): string => {
  if (call.functionName) {
    if (!call.subcalls?.length) return call.functionName;
    const inner = call.subcallCount ?? call.subcalls.length;
    return `${call.functionName} (${inner} ${inner === 1 ? "call" : "calls"})`;
  }
  if (call.value && call.value > 0n) return "ETH transfer";
  return call.selector ? `selector ${call.selector}` : "empty call";
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
    // 2 calls: …"; naming it with its arity reads better.
    if (child.summary && !child.subcalls?.length) {
      const sentence = child.summary.replace(/\.$/, "");
      return sentence.charAt(0).toLowerCase() + sentence.slice(1);
    }
    const target = child.target ? ` on ${shortAddress(child.target)}` : "";
    return `${subcallNoun(child)}${target}`;
  }
  const names = [...new Set(subcalls.map(subcallNoun))];
  const listed = names.slice(0, MAX_LISTED_SUBCALLS);
  const rest = names.length - listed.length;
  return rest > 0 ? `${listed.join(", ")}, +${rest} more` : listed.join(", ");
};

/**
 * Deterministic one-sentence effect summary for known functions. Unknown
 * signatures return null and the UI falls back to showing the signature.
 */
export const summarize = (node: DecodedCall): string | null => {
  // Plain ETH transfer: no calldata, only value.
  if (node.selector === null) {
    if (node.value && node.value > 0n) {
      const ether = humanizeEtherValue(node.value).text;
      const to = node.target ? ` to ${shortAddress(node.target)}` : "";
      return `Transfers ${ether}${to}.`;
    }
    return null;
  }

  // Multicall wrappers summarize by what they carry, which can exceed what
  // the node budget managed to decode.
  const detector = getDetector(node.selector);
  if (detector && node.subcalls !== undefined) {
    const count = node.subcallCount ?? node.subcalls.length;
    const noun = count === 1 ? "call" : "calls";
    const detail = describeSubcalls(node.subcalls, count);
    return detail
      ? `${detector.verb} ${count} ${noun}: ${detail}.`
      : `${detector.verb} ${count} ${noun}.`;
  }

  if (!node.signature) return null;
  const template = TEMPLATES[node.signature];
  return template ? template(node) : null;
};
