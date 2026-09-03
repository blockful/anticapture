"use client";

import { useEffect, useRef, useState } from "react";

type UseActionExpansionArgs = {
  /** sessionStorage key; expansion is remembered per proposal per session. */
  storageKey: string;
  /** Indexes expanded when nothing is stored (the first action, usually). */
  defaultExpanded?: number[];
};

/**
 * Expansion state for the action list: first action open by default,
 * remembered per session, and deep-linkable via a #action-N hash. Storage is
 * read in an effect (never in the initializer) so server and client render
 * the same first frame, and all storage access is try/caught for browsers
 * that deny it.
 *
 * The persist effect only writes for the key the state was hydrated FROM:
 * on a client-side navigation between proposals the hook stays mounted, and
 * without that guard the old proposal's set would leak into the new key
 * before rehydration runs.
 */
export const useActionExpansion = ({
  storageKey,
  defaultExpanded = [0],
}: UseActionExpansionArgs) => {
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(
    () => new Set(defaultExpanded),
  );
  const hydratedKeyRef = useRef<string | null>(null);

  // a fresh array literal per render; keying the effect on it would loop.
  useEffect(() => {
    // Reset first: an unseen key must start from the defaults, never from the
    // previous proposal's state.
    let next = new Set(defaultExpanded);
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) next = new Set(JSON.parse(stored) as number[]);
    } catch {
      // Storage denied (private mode, embedded webview): defaults stand.
    }

    // Deep link: /proposal/N?tab=actions#action-2 expands and reveals row 2.
    const match = /^#action-(\d+)$/.exec(window.location.hash);
    if (match) {
      next = new Set([...next, Number(match[1]) - 1]);
      setTimeout(() => {
        document
          .getElementById(`action-${match[1]}`)
          ?.scrollIntoView({ block: "start" });
      }, 0);
    }

    setExpanded(next);
    hydratedKeyRef.current = storageKey;
  }, [storageKey]);

  useEffect(() => {
    if (hydratedKeyRef.current !== storageKey) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify([...expanded]));
    } catch {
      // Nothing to do: the state simply is not remembered.
    }
  }, [expanded, storageKey]);

  return {
    isExpanded: (index: number) => expanded.has(index),
    toggle: (index: number) =>
      setExpanded((current) => {
        const next = new Set(current);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      }),
  };
};
