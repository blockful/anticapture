"use client";

import { useEffect, useState } from "react";

export type OffchainVoteIndexingStatus =
  | "idle"
  | "indexing"
  | "indexed"
  | "stuck";

/** The "Indexed" chip lingers this long before fading out. */
const INDEXED_FADE_MS = 1200;
/** Fade duration, matching the chip's transition-opacity class. */
const FADE_OUT_MS = 300;
/**
 * Snapshot has accepted the vote but our indexer still has not picked it up:
 * past this point we say so explicitly instead of implying something is broken.
 */
const STUCK_AFTER_MS = 2 * 60 * 1000;

interface UseOffchainVoteIndexingParams {
  /** Epoch ms when the signature returned, or null when no vote is in flight. */
  signedAt: number | null;
  /** True once the indexer reflects the vote. */
  isIndexed: boolean;
}

/**
 * Drives the optimistic-vote chip lifecycle in the results card header:
 * "Indexing your vote…" -> "Indexed" -> fade out, with a "confirmed on
 * Snapshot, indexer catching up" fallback once the wait passes two minutes.
 */
export const useOffchainVoteIndexing = ({
  signedAt,
  isIndexed,
}: UseOffchainVoteIndexingParams) => {
  const [status, setStatus] = useState<OffchainVoteIndexingStatus>("idle");
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (signedAt === null) {
      setStatus("idle");
      setIsFading(false);
      return;
    }

    if (isIndexed) {
      setStatus("indexed");
      setIsFading(false);
      const fadeTimer = setTimeout(
        () => setIsFading(true),
        INDEXED_FADE_MS - FADE_OUT_MS,
      );
      const idleTimer = setTimeout(() => setStatus("idle"), INDEXED_FADE_MS);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(idleTimer);
      };
    }

    setIsFading(false);
    // Re-mounting mid-wait (e.g. a tab revisit) must not restart the 2 min clock.
    const remaining = STUCK_AFTER_MS - (Date.now() - signedAt);
    if (remaining <= 0) {
      setStatus("stuck");
      return;
    }
    setStatus("indexing");
    const stuckTimer = setTimeout(() => setStatus("stuck"), remaining);
    return () => clearTimeout(stuckTimer);
  }, [signedAt, isIndexed]);

  return {
    status,
    isFading,
    /** Optimistic counts stay applied until the indexer actually catches up. */
    isOptimistic: status === "indexing" || status === "stuck",
  };
};
