"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import { isHex, keccak256, type Address, type Hex } from "viem";

import { createAbiResolver } from "@/shared/services/decoder/abi/resolveAbi";
import type { UploadedAbiStore } from "@/shared/services/decoder/abi/uploadedStore";
import {
  decodeCalldata,
  isDegradedDecode,
} from "@/shared/services/decoder/decode";
import type { DecodedCall } from "@/shared/services/decoder/types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
// A decode that fell back to guessed words may just have hit an Etherscan or
// OpenChain outage; keep it fresh only briefly so remounts and window focus
// can obtain the real decode once the service recovers.
const DEGRADED_STALE_TIME_MS = 30 * 1000;

/**
 * Calldata never changes for a given hash, so the query key carries a digest
 * instead of multi-KB hex. Malformed pastes hash their full UTF-8 bytes: a
 * prefix-based key would let two long pastes sharing a prefix serve each
 * other's cached error card.
 */
const calldataKey = (calldata: string): string =>
  isHex(calldata) && calldata.length % 2 === 0
    ? keccak256(calldata as Hex)
    : `raw:${keccak256(new TextEncoder().encode(calldata))}`;

type UseDecodedCalldataArgs = {
  chainId: number;
  target?: Address;
  calldata: string | null;
  value?: bigint;
  /** Its version is part of the key: an upload re-decodes automatically. */
  uploadedAbis?: UploadedAbiStore;
  enabled?: boolean;
  /** Lazy nested decodes continue from their parent's depth. */
  startDepth?: number;
};

export const useDecodedCalldata = ({
  chainId,
  target,
  calldata,
  value,
  uploadedAbis,
  enabled = true,
  startDepth,
}: UseDecodedCalldataArgs): UseQueryResult<DecodedCall> => {
  const uploadedVersion = uploadedAbis?.version ?? 0;
  // The resolver memoizes fetches per instance; rebuild only when an upload
  // changes what a lookup could return.

  const resolver = useMemo(
    () => createAbiResolver({ uploaded: uploadedAbis }),
    [uploadedAbis, uploadedVersion],
  );

  return useQuery<DecodedCall>({
    queryKey: [
      "decoder",
      "decode",
      chainId,
      target?.toLowerCase() ?? "-",
      calldata === null ? "-" : calldataKey(calldata),
      value?.toString() ?? "0",
      // Store id + version: version counters restart at zero when a page
      // remounts and creates a fresh store, and the 24h query cache must not
      // serve a decode made with a previous store's ABI under the same key.
      uploadedAbis ? `${uploadedAbis.id}:${uploadedVersion}` : "-",
      startDepth ?? 0,
    ],
    queryFn: () =>
      decodeCalldata(
        { chainId, target, calldata: calldata ?? "0x", value },
        resolver,
        { startDepth },
      ),
    enabled: enabled && calldata !== null,
    // Calldata is immutable, so a full decode is authoritative forever; only
    // degraded results (word-guess fallback, decode error) expire.
    staleTime: (query) =>
      query.state.data && isDegradedDecode(query.state.data)
        ? DEGRADED_STALE_TIME_MS
        : Infinity,
    gcTime: DAY_IN_MS,
    retry: false,
    // Only stale (degraded) decodes ever refetch on focus.
    refetchOnWindowFocus: true,
  });
};
