import {
  decodeFunctionData,
  parseAbiItem,
  toFunctionSelector,
  toFunctionSignature,
  type Abi,
  type AbiFunction,
  type Address,
  type Hex,
} from "viem";

import { getBundledAbi } from "@/shared/services/decoder/abi/bundledAbis";
import { fetchVerifiedAbi as fetchVerifiedAbiDefault } from "@/shared/services/decoder/abi/etherscan";
import { getKnownFunction as getKnownFunctionDefault } from "@/shared/services/decoder/abi/knownAbis";
import { fetchSignatures as fetchSignaturesDefault } from "@/shared/services/decoder/abi/openchain";
import type { UploadedAbiStore } from "@/shared/services/decoder/abi/uploadedStore";
import type { DecodeWarning } from "@/shared/services/decoder/types";

export type ResolvedAbi = {
  source: "verified" | "uploaded" | "known" | "openchain";
  fn: AbiFunction;
  signature: string;
  warning?: DecodeWarning;
};

export type AbiResolveContext = {
  chainId: number;
  target?: Address;
  selector: Hex;
  /** Full calldata, used to validate OpenChain candidates by decoding. */
  calldata: Hex;
};

export type AbiResolver = (
  ctx: AbiResolveContext,
) => Promise<ResolvedAbi | null>;

type ResolverDeps = {
  fetchVerifiedAbi?: (chainId: number, address: string) => Promise<Abi | null>;
  fetchSignatures?: (selector: Hex) => Promise<string[]>;
  uploaded?: UploadedAbiStore;
  getKnownFunction?: (selector: Hex) => AbiFunction | null;
};

const findBySelector = (abi: Abi, selector: Hex): AbiFunction | null => {
  for (const item of abi) {
    if (item.type !== "function") continue;
    try {
      if (toFunctionSelector(item).toLowerCase() === selector.toLowerCase()) {
        return item;
      }
    } catch {
      // A malformed item in an uploaded ABI must not sink the lookup.
    }
  }
  return null;
};

const decodes = (fn: AbiFunction, calldata: Hex): boolean => {
  try {
    decodeFunctionData({ abi: [fn], data: calldata });
    return true;
  } catch {
    return false;
  }
};

/**
 * The PRD's ABI fallback chain: verified (bundled, then Etherscan) ->
 * user-uploaded -> known canonical selectors -> OpenChain signature database
 * -> null (the caller word-guesses). The target's own ABI outranks the known
 * table so a 4-byte collision (transferFrom vs gasprice_bit_ether, both
 * 0x23b872dd) decodes as whatever the contract actually implements.
 * Resolutions are memoized per resolver instance so a batch of subcalls to
 * one contract triggers a single fetch.
 */
export const createAbiResolver = (deps: ResolverDeps = {}): AbiResolver => {
  const fetchVerified = deps.fetchVerifiedAbi ?? fetchVerifiedAbiDefault;
  const fetchSignatures = deps.fetchSignatures ?? fetchSignaturesDefault;
  const getKnownFunction = deps.getKnownFunction ?? getKnownFunctionDefault;
  // The fetches are memoized, not the final pick: choosing an OpenChain
  // candidate depends on the full calldata, which varies per call even when
  // chain, target and selector repeat across a batch.
  const verifiedAbis = new Map<string, Promise<Abi | null>>();
  const openchainSignatures = new Map<string, Promise<string[]>>();

  const resolveVerified = async (
    ctx: AbiResolveContext,
  ): Promise<ResolvedAbi | null> => {
    if (!ctx.target) return null;
    const bundled = getBundledAbi(ctx.chainId, ctx.target);
    let abi = bundled;
    if (!abi) {
      const key = `${ctx.chainId}:${ctx.target.toLowerCase()}`;
      let pending = verifiedAbis.get(key);
      if (!pending) {
        // Null covers both "not verified" and transport failure, and the two
        // are indistinguishable here; evict so a later refetch (the hook
        // expires degraded decodes) can try again instead of replaying the
        // memoized failure for the resolver's lifetime.
        pending = fetchVerified(ctx.chainId, ctx.target).then((result) => {
          if (result === null) verifiedAbis.delete(key);
          return result;
        });
        verifiedAbis.set(key, pending);
      }
      abi = await pending;
    }
    if (!abi) return null;
    const fn = findBySelector(abi, ctx.selector);
    if (!fn) return null;
    return { source: "verified", fn, signature: toFunctionSignature(fn) };
  };

  const resolveUploaded = (ctx: AbiResolveContext): ResolvedAbi | null => {
    const abi = deps.uploaded?.get(ctx.target);
    if (!abi) return null;
    const fn = findBySelector(abi, ctx.selector);
    if (!fn) return null;
    return { source: "uploaded", fn, signature: toFunctionSignature(fn) };
  };

  const resolveOpenchain = async (
    ctx: AbiResolveContext,
  ): Promise<ResolvedAbi | null> => {
    const key = ctx.selector.toLowerCase();
    let pending = openchainSignatures.get(key);
    if (!pending) {
      // An empty list may be a transient OpenChain failure; evict it so the
      // next resolution retries instead of replaying the failure forever.
      pending = fetchSignatures(ctx.selector).then((result) => {
        if (result.length === 0) openchainSignatures.delete(key);
        return result;
      });
      openchainSignatures.set(key, pending);
    }
    const signatures = await pending;
    const decodable: Array<{ fn: AbiFunction; signature: string }> = [];
    for (const textSignature of signatures) {
      let fn: AbiFunction;
      try {
        fn = parseAbiItem(`function ${textSignature}`) as AbiFunction;
      } catch {
        continue;
      }
      if (decodes(fn, ctx.calldata)) {
        decodable.push({ fn, signature: textSignature });
      }
    }
    if (decodable.length === 0) return null;
    const [first] = decodable;
    return {
      source: "openchain",
      fn: first.fn,
      signature: first.signature,
      warning:
        decodable.length > 1
          ? {
              code: "openchain-ambiguous",
              message:
                "Several known signatures decode this calldata; showing the best-ranked one.",
              candidates: decodable.map((candidate) => candidate.signature),
            }
          : undefined,
    };
  };

  const resolveKnown = (ctx: AbiResolveContext): ResolvedAbi | null => {
    const fn = getKnownFunction(ctx.selector);
    // Validated by decoding: on a selector collision where the calldata does
    // not fit the canonical shape, fall through to OpenChain instead of
    // presenting a decode error for the wrong function.
    if (!fn || !decodes(fn, ctx.calldata)) return null;
    // "known", not "verified": a canonical shape is trusted, but it is not
    // proof of what the target implements, and it may be standing in for a
    // verified lookup that transiently failed.
    return { source: "known", fn, signature: toFunctionSignature(fn) };
  };

  return async (ctx) => {
    const verified = await resolveVerified(ctx);
    if (verified) return verified;
    const uploaded = resolveUploaded(ctx);
    if (uploaded) return uploaded;
    const known = resolveKnown(ctx);
    if (known) return known;
    return resolveOpenchain(ctx);
  };
};
