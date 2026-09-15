import { maxUint256 } from "viem";

import { humanizeEtherValue } from "@/shared/services/decoder/humanize/tokenAmount";
import { getDetector } from "@/shared/services/decoder/multicall/detectors";
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

/** "the PROPOSER_ROLE role", or the hash when no known name matches it. */
const roleText = (param: DecodedParam | undefined): string => {
  if (!param) return "an unknown role";
  if (param.humanized?.kind === "role")
    return `the ${param.humanized.text} role`;
  return `role ${shortAddress(param.value)}`;
};

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
  "grantRole(bytes32,address)": (node) =>
    `Grants ${roleText(paramAt(node, 0))} to ${addressText(paramAt(node, 1))}.`,
  "revokeRole(bytes32,address)": (node) =>
    `Revokes ${roleText(paramAt(node, 0))} from ${addressText(paramAt(node, 1))}.`,
  "renounceRole(bytes32,address)": (node) =>
    `Renounces ${roleText(paramAt(node, 0))} for ${addressText(paramAt(node, 1))}.`,
};

/** How many kinds of inner call a batch summary spells out. */
const MAX_LISTED_KINDS = 3;

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

type Noun = { one: string; many: string };
const noun = (one: string, many = `${one}s`): Noun => ({ one, many });

const isUnlimited = (param: DecodedParam | undefined): boolean => {
  if (!param || !/^\d+$/.test(param.value)) return false;
  return BigInt(param.value) === maxUint256;
};

/**
 * What a subcall IS, as something that can be counted: "3 unlimited
 * approvals, 1 role grant" says more about a batch than "approve, grantRole,
 * +2 more". Known effects get a noun; anything else is named by its function.
 */
const subcallKind = (call: DecodedCall): Noun => {
  if (call.functionName && call.subcalls?.length) {
    return noun(`${call.functionName} batch`, `${call.functionName} batches`);
  }
  switch (call.signature) {
    case "approve(address,uint256)":
      if (tokenIdParam(call)) return noun("NFT approval");
      return isUnlimited(paramAt(call, 1))
        ? noun("unlimited approval")
        : noun("approval");
    case "transfer(address,uint256)":
    case "transferFrom(address,address,uint256)":
    case "safeTransferFrom(address,address,uint256)":
    case "safeTransferFrom(address,address,uint256,uint256,bytes)":
      return noun("transfer");
    case "delegate(address)":
      return noun("delegation");
    case "grantRole(bytes32,address)":
      return noun("role grant");
    case "revokeRole(bytes32,address)":
      return noun("role revocation");
    case "renounceRole(bytes32,address)":
      return noun("role renunciation");
    case "updateDelay(uint256)":
      return noun("delay update");
  }
  if (call.functionName) return noun(`${call.functionName} call`);
  if (call.value && call.value > 0n) return noun("ETH transfer");
  if (call.selector) return noun(`${call.selector} call`);
  return noun("empty call");
};

/**
 * What a wrapper carries, so "Executes 1 call." becomes "Executes 1 call:
 * transfers 25,000 USDC to 0x1234…abcd." A single decoded child lends its
 * whole sentence; several children are grouped by kind and counted. Children
 * the node budget dropped stay uncounted here (the count itself already says
 * so).
 */
const describeSubcalls = (
  subcalls: NonNullable<DecodedCall["subcalls"]>,
  count: number,
): string | null => {
  // A child the depth limit left raw has no name to lend, and listing it by
  // selector would fill the sentence with hex that says nothing. The arity
  // alone is the honest summary then.
  const opened = subcalls.filter(
    (call) => !call.warnings.some((warning) => warning.code === "depth-limit"),
  );
  if (opened.length === 0) return null;
  if (count === 1) {
    const [child] = opened;
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
  // Grouped by kind and by what the batch promises about it: a tolerated
  // failure or a delegatecall changes what a call means, so it is its own
  // group even when it shares a kind with the rest.
  const groups = new Map<
    string,
    { kind: Noun; suffix: string; count: number }
  >();
  for (const call of opened) {
    const kind = subcallKind(call);
    const suffix = qualifiers(call);
    const key = `${kind.one}${suffix}`;
    const group = groups.get(key);
    if (group) group.count += 1;
    else groups.set(key, { kind, suffix, count: 1 });
  }
  const phrases = [...groups.values()].map(
    ({ kind, suffix, count: n }) =>
      `${n} ${n === 1 ? kind.one : kind.many}${suffix}`,
  );
  const listed = phrases.slice(0, MAX_LISTED_KINDS);
  // When children were dropped or left raw, the kinds are a sample of the
  // batch and cannot claim an exact remainder. The leading count is the one
  // that speaks for the whole batch.
  if (opened.length < count) return `${listed.join(", ")}, …`;
  const rest = [...groups.values()]
    .slice(MAX_LISTED_KINDS)
    .reduce((sum, group) => sum + group.count, 0);
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
    const nouns = detector.noun ?? { one: "call", many: "calls" };
    const noun = count === 1 ? nouns.one : nouns.many;
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
