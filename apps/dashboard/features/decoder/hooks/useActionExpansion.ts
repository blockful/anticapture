"use client";

import { useEffect, useState } from "react";

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
 */
export const useActionExpansion = ({
  storageKey,
  defaultExpanded = [0],
}: UseActionExpansionArgs) => {
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(
    () => new Set(defaultExpanded),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const indexes = JSON.parse(stored) as number[];
        setExpanded(new Set(indexes));
      }
    } catch {
      // Storage denied (private mode, embedded webview): defaults stand.
    }

    // Deep link: /proposal/N?tab=actions#action-2 expands and reveals row 2.
    const match = /^#action-(\d+)$/.exec(window.location.hash);
    if (match) {
      const index = Number(match[1]) - 1;
      setExpanded((current) => new Set([...current, index]));
      setTimeout(() => {
        document
          .getElementById(`action-${match[1]}`)
          ?.scrollIntoView({ block: "start" });
      }, 0);
    }

    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify([...expanded]));
    } catch {
      // Nothing to do: the state simply is not remembered.
    }
  }, [expanded, hydrated, storageKey]);

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
