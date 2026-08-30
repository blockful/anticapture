"use client";

import { useState } from "react";
import type { Address } from "viem";

import { DecodedActionCard } from "@/features/decoder/components/DecodedActionCard";
import { DecoderCardSkeleton } from "@/features/decoder/components/DecoderCardSkeleton";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { useDecodedCalldata } from "@/shared/hooks/useDecodedCalldata";
import { useDelayedFlag } from "@/shared/hooks/useDelayedFlag";

/** Nested cards stop offering "[+ decode]" past this depth. */
const MAX_NESTED_DECODE_DEPTH = 4;

interface NestedBytesDecodeProps {
  calldata: string;
  /** Known for multicall-style subcalls, unknown for arbitrary struct bytes. */
  target?: Address;
  chainId: number;
  explorerUrl?: string;
  depth: number;
}

/**
 * The lazy decode boundary for calldata-shaped `bytes` params: nothing is
 * fetched until the reader asks, then the same engine renders a nested card
 * one rail deeper.
 */
export const NestedBytesDecode = ({
  calldata,
  target,
  chainId,
  explorerUrl,
  depth,
}: NestedBytesDecodeProps) => {
  const [requested, setRequested] = useState(false);
  const { data, isLoading } = useDecodedCalldata({
    chainId,
    target,
    calldata,
    enabled: requested,
    startDepth: depth + 1,
  });
  const showSkeleton = useDelayedFlag(requested && isLoading);

  if (depth >= MAX_NESTED_DECODE_DEPTH) return null;

  if (!requested) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setRequested(true)}
        className="text-secondary hover:text-primary w-fit font-mono text-xs uppercase tracking-wider"
      >
        [+ decode]
      </Button>
    );
  }

  if (!data) {
    return showSkeleton ? <DecoderCardSkeleton rows={2} /> : null;
  }

  return (
    <DecodedActionCard
      call={data}
      chainId={chainId}
      explorerUrl={explorerUrl}
    />
  );
};
