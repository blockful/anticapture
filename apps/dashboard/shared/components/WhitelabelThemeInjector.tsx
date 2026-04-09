"use client";

import { useEffect } from "react";

/**
 * Applies DAO-specific CSS variables to document.documentElement so that
 * portal-based elements (drawers, modals, tooltips) rendered outside the
 * whitelabel layout div also inherit the correct brand colors.
 */
export const WhitelabelThemeInjector = ({
  variables,
}: {
  variables: Record<string, string>;
}) => {
  useEffect(() => {
    const root = document.documentElement;
    const entries = Object.entries(variables);

    entries.forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    return () => {
      entries.forEach(([key]) => {
        root.style.removeProperty(key);
      });
    };
  }, [variables]);

  return null;
};
