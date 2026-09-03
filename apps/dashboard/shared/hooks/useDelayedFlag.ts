"use client";

import { useEffect, useState } from "react";

/**
 * True only after `active` has stayed true for `delayMs`; false immediately
 * when it drops. Gates loading skeletons so cached results (which resolve
 * synchronously) never flash one.
 */
export const useDelayedFlag = (active: boolean, delayMs = 300): boolean => {
  const [flag, setFlag] = useState(false);

  useEffect(() => {
    if (!active) {
      setFlag(false);
      return;
    }
    const timer = setTimeout(() => setFlag(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return flag;
};
