import type { Address, Hex } from "viem";

export type AbiSource =
  | "verified"
  | "uploaded"
  /** Canonical well-known signature (ERC20, Safe, Multicall3, Timelock…):
   *  trusted shape, but not proof of what the target actually implements. */
  | "known"
  | "openchain"
  | "none";

export type Humanized =
  | { kind: "duration"; text: string }
  | { kind: "timestamp"; text: string; iso: string }
  | { kind: "tokenAmount"; text: string; symbol: string; decimals: number }
  | { kind: "etherValue"; text: string }
  | { kind: "number"; text: string };

export type DecodedParam = {
  /** ABI name, or "arg0".."argN" when the shape was guessed from raw words. */
  name: string;
  /** Solidity type. Word-guessed params carry the best guess, not a fact. */
  type: string;
  /**
   * Raw value, stringified: bigints as decimal strings, bytes as hex,
   * addresses checksummed. Always the encoding source of truth.
   */
  value: string;
  /** Primary display value; `value` becomes the dimmed annotation. */
  humanized?: Humanized;
  /** Tuple components / array elements. */
  children?: DecodedParam[];
  /** The UI resolves identity (ENS, labels) for flagged params. */
  isAddress?: boolean;
  /** Bytes leaf shaped like calldata: gets a lazy "decode" affordance. */
  isCalldataLike?: boolean;
  /** Uint that is an ERC20 amount of `token`; enriched asynchronously. */
  tokenHint?: { token: Address };
};

export type DecodeWarning =
  | { code: "guessed-types"; message: string }
  | { code: "depth-limit"; message: string }
  | { code: "size-limit"; message: string }
  | { code: "openchain-ambiguous"; message: string; candidates: string[] }
  | { code: "delegatecall"; message: string };

export type DecodedCall = {
  chainId: number;
  target?: Address;
  /** ETH attached to the call (proposal action value or extracted subcall). */
  value?: bigint;
  /** Null when the calldata is empty or shorter than 4 bytes. */
  selector: Hex | null;
  functionName?: string;
  /** Canonical signature, e.g. "transfer(address,uint256)". */
  signature?: string;
  abiSource: AbiSource;
  /** Empty on failure; `raw` below still preserves the input verbatim. */
  params: DecodedParam[];
  /** Set when a multicall detector unpacked nested calls. */
  subcalls?: Array<DecodedCall & { index: number }>;
  /** The input, verbatim. Never lost, whatever else fails. */
  raw: Hex;
  /** 0 = root. Recursion stops at the decode option maxDepth. */
  depth: number;
  warnings: DecodeWarning[];
  error?: string;
  /** Deterministic template sentence; null = UI falls back to the signature. */
  summary: string | null;
};
