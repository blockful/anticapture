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
/**
 * Fetch memoization is shared per fetcher function (module-lived for the
 * default Etherscan/OpenChain fetchers), not per resolver instance: a
 * proposal page mounts one hook per action, and N actions against the same
 * contract must cost one upstream request, not N. Negative results (null ABI,
 * empty signature list) stay cached briefly — long enough to absorb focus
 * refetch bursts, short enough that a transient outage can heal.
 */
const NEGATIVE_RESULT_TTL_MS = 60_000;

/** Ambiguous-signature candidates carried on the warning. */
const MAX_LISTED_CANDIDATES = 5;

type CacheEntry<T> = { promise: Promise<T>; negativeAt?: number };

/**
 * One cache per fetcher identity, so every resolver instance built around the
 * same fetcher shares it. They are declared per result type rather than as one
 * erased map: a single map would have to hand each caller its entries back as
 * something it merely asserts they are.
 */
const abiCaches = new WeakMap<object, Map<string, CacheEntry<Abi | null>>>();
const signatureCaches = new WeakMap<
  object,
  Map<string, CacheEntry<string[]>>
>();

/** Entries one cache keeps. A verified ABI runs to hundreds of KB and these
 *  caches live as long as the tab, so they evict least-recently-used rather
 *  than growing with every address a reader ever looked at. */
const MAX_CACHE_ENTRIES = 256;

/** Reading also promotes: a Map iterates in insertion order, so re-inserting
 *  the entry is what makes the eviction below least-recently-used. */
const readEntry = <T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
): CacheEntry<T> | undefined => {
  const entry = cache.get(key);
  if (entry) {
    cache.delete(key);
    cache.set(key, entry);
  }
  return entry;
};

const writeEntry = <T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  entry: CacheEntry<T>,
): void => {
  cache.set(key, entry);
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  const oldest = cache.keys().next();
  if (!oldest.done) cache.delete(oldest.value);
};

const cachedFetch = <T>(
  caches: WeakMap<object, Map<string, CacheEntry<T>>>,
  fetcher: object,
  key: string,
  run: () => Promise<T>,
  isNegative: (result: T) => boolean,
): Promise<T> => {
  let cache = caches.get(fetcher);
  if (!cache) {
    cache = new Map();
    caches.set(fetcher, cache);
  }
  let entry = readEntry(cache, key);
  if (
    entry?.negativeAt !== undefined &&
    Date.now() - entry.negativeAt > NEGATIVE_RESULT_TTL_MS
  ) {
    entry = undefined;
  }
  if (!entry) {
    const created: CacheEntry<T> = {
      promise: run().then((result) => {
        if (isNegative(result)) created.negativeAt = Date.now();
        return result;
      }),
    };
    writeEntry(cache, key, created);
    entry = created;
  }
  return entry.promise;
};

export const createAbiResolver = (deps: ResolverDeps = {}): AbiResolver => {
  const fetchVerified = deps.fetchVerifiedAbi ?? fetchVerifiedAbiDefault;
  const fetchSignatures = deps.fetchSignatures ?? fetchSignaturesDefault;
  const getKnownFunction = deps.getKnownFunction ?? getKnownFunctionDefault;

  const resolveVerified = async (
    ctx: AbiResolveContext,
  ): Promise<ResolvedAbi | null> => {
    if (!ctx.target) return null;
    const target = ctx.target;
    const bundled = getBundledAbi(ctx.chainId, target);
    const abi =
      bundled ??
      (await cachedFetch(
        abiCaches,
        fetchVerified,
        `${ctx.chainId}:${target.toLowerCase()}`,
        () => fetchVerified(ctx.chainId, target),
        (result) => result === null,
      ));
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
    const signatures = await cachedFetch(
      signatureCaches,
      fetchSignatures,
      ctx.selector.toLowerCase(),
      () => fetchSignatures(ctx.selector),
      (result) => result.length === 0,
    );
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
              // Bounded: this rides in a 24h query cache and OpenChain can
              // return a long tail for a popular selector.
              candidates: decodable
                .slice(0, MAX_LISTED_CANDIDATES)
                .map((candidate) => candidate.signature),
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
