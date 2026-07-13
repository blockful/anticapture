"use client";

import { useCallback, useState } from "react";
import { createSiweMessage } from "viem/siwe";

import { authClient } from "@/shared/services/auth/client";

// Mirrors the user-api's PREVIEW_LOGIN_* constants (apps/user-api/src/auth.ts):
// in Railway PR previews the SIWE verifier accepts exactly this pair, so the
// preview link signs in as the shared test account without a wallet. The
// pair is deliberately public — it is refused outside preview environments.
const PREVIEW_LOGIN_ADDRESS = "0x1111111111111111111111111111111111111111";
const PREVIEW_LOGIN_SIGNATURE = `0x${"11".repeat(65)}`;

export type PreviewLoginStatus = "idle" | "signing" | "error";

/**
 * One-click sign-in for preview deployments: runs the normal SIWE ceremony
 * (nonce -> verify) with the shared test credential. Completion is
 * session-store-driven like the real SIWE flow — LoginProvider's watcher
 * closes the modal once the session lands.
 */
export const usePreviewLogin = () => {
  const [status, setStatus] = useState<PreviewLoginStatus>("idle");

  const login = useCallback(async () => {
    setStatus("signing");
    try {
      const { data } = (await authClient.siwe.nonce({
        walletAddress: PREVIEW_LOGIN_ADDRESS,
        chainId: 1,
      })) as { data: { nonce: string } | null };
      if (!data) throw new Error("failed to get nonce");

      const message = createSiweMessage({
        domain: window.location.host,
        address: PREVIEW_LOGIN_ADDRESS,
        chainId: 1,
        uri: window.location.origin,
        version: "1",
        nonce: data.nonce,
        statement: "Preview sign-in to Anticapture.",
      });
      const { error } = await authClient.siwe.verify({
        message,
        signature: PREVIEW_LOGIN_SIGNATURE,
        walletAddress: PREVIEW_LOGIN_ADDRESS,
        chainId: 1,
      });
      if (error) throw error;

      // Same store quirk as useSiweLogin: the bundled siweClient has no
      // atomListeners, so the session store must be told to refetch.
      authClient.$store.notify("$sessionSignal");
      window.setTimeout(
        () => setStatus((s) => (s === "signing" ? "idle" : s)),
        8000,
      );
    } catch {
      setStatus("error");
    }
  }, []);

  return { login, status };
};
