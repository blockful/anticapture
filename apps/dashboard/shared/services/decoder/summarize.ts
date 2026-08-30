import { getDetector } from "@/shared/services/decoder/multicall/detectors";
import { humanizeEtherValue } from "@/shared/services/decoder/humanize/tokenAmount";
import type {
  DecodedCall,
  DecodedParam,
} from "@/shared/services/decoder/types";

const shortAddress = (address: string): string =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

const paramByName = (
  node: DecodedCall,
  ...names: string[]
): DecodedParam | undefined =>
  node.params.find((param) => names.includes(param.name));

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
const tokenIdParam = (node: DecodedCall): DecodedParam | undefined =>
  node.params.find((param) => /tokenid|^id$/i.test(param.name));

const TEMPLATES: Record<string, Template> = {
  "transfer(address,uint256)": (node) =>
    `Transfers ${amountText(paramByName(node, "amount", "value", "arg1"))} to ${addressText(paramByName(node, "to", "recipient", "dst", "arg0"))}.`,
  "approve(address,uint256)": (node) => {
    const tokenId = tokenIdParam(node);
    if (tokenId) {
      return `Approves ${addressText(paramByName(node, "spender", "to", "arg0"))} to manage token #${tokenId.value}.`;
    }
    return `Approves ${addressText(paramByName(node, "spender", "arg0"))} to spend ${amountText(paramByName(node, "amount", "value", "arg1"))}.`;
  },
  "transferFrom(address,address,uint256)": (node) => {
    const tokenId = tokenIdParam(node);
    if (tokenId) {
      return `Transfers token #${tokenId.value} from ${addressText(paramByName(node, "from", "arg0"))} to ${addressText(paramByName(node, "to", "arg1"))}.`;
    }
    return `Transfers ${amountText(paramByName(node, "amount", "value", "arg2"))} from ${addressText(paramByName(node, "from", "src", "arg0"))} to ${addressText(paramByName(node, "to", "dst", "arg1"))}.`;
  },
  "delegate(address)": (node) =>
    `Delegates the caller's voting power to ${addressText(paramByName(node, "delegatee", "arg0"))}.`,
  "safeTransferFrom(address,address,uint256)": (node) =>
    `Transfers token #${paramByName(node, "tokenId", "arg2")?.value ?? "?"} from ${addressText(paramByName(node, "from", "arg0"))} to ${addressText(paramByName(node, "to", "arg1"))}.`,
  "safeTransferFrom(address,address,uint256,uint256,bytes)": (node) =>
    `Transfers ${paramByName(node, "amount", "arg3")?.value ?? "?"} of token #${paramByName(node, "id", "arg2")?.value ?? "?"} from ${addressText(paramByName(node, "from", "arg0"))} to ${addressText(paramByName(node, "to", "arg1"))}.`,
  "updateDelay(uint256)": (node) => {
    const delay = paramByName(node, "newDelay", "arg0");
    const text = delay?.humanized?.text ?? `${delay?.value ?? "?"} seconds`;
    return `Updates the timelock delay to ${text}.`;
  },
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

  // Multicall wrappers summarize by what they unpack.
  const detector = getDetector(node.selector);
  if (detector && node.subcalls !== undefined) {
    const count = node.subcalls.length;
    const noun = count === 1 ? "call" : "calls";
    return `${detector.verb} ${count} ${noun}.`;
  }

  if (!node.signature) return null;
  const template = TEMPLATES[node.signature];
  return template ? template(node) : null;
};
