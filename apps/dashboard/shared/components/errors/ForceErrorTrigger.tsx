"use client";

import { useEffect, useState } from "react";

/**
 * Throws a render error after hydration when `?forceError` is present in the
 * URL. Exists solely so the error-boundary Playwright spec can exercise the
 * route `error.tsx` recovery path deterministically; inert otherwise.
 * Throwing post-hydration (instead of during SSR) keeps the document response
 * a 200, which the e2e 5xx watcher would otherwise flag.
 */
export const ForceErrorTrigger = () => {
  const [forced, setForced] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (new URLSearchParams(window.location.search).has("forceError")) {
      setForced(true);
    }
  }, []);

  if (forced) {
    throw new Error("Forced render error (?forceError e2e hook)");
  }

  return null;
};
