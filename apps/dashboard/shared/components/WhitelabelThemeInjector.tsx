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
    const hasDark = root.classList.contains("dark");

    if (hasDark) {
      root.classList.remove("dark");
    }

    entries.forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    return () => {
      entries.forEach(([key]) => {
        root.style.removeProperty(key);
      });
      if (hasDark) {
        root.classList.add("dark");
      }
    };
  }, [variables]);

  return null;
};
