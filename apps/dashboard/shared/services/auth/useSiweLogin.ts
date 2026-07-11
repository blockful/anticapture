"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSiweMessage } from "viem/siwe";
import { useAccount, useChainId, useSignMessage } from "wagmi";

import { authClient } from "./client";

export type SiweLoginStatus =
  | "idle"
  | "connecting"
  | "signing"
  | "verifying"
  | "error";

type NonceResult = { data: { nonce: string } | null; error: unknown };

/**
 * Runs the SIWE ceremony against the User API (nonce -> wallet signature ->
 * verify), issuing the better-auth session cookie. When no wallet is connected
 * it opens the RainbowKit connect modal first, then resumes automatically once
 * the wallet connects. Completion is signalled through the session store
 * (LoginProvider watches it) rather than a callback, so nothing acts on a
 * "logged in" state before the store actually holds the session.
 */
export const useSiweLogin = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  const [status, setStatus] = useState<SiweLoginStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  // Set when login() opened the connect modal and is waiting for a wallet.
  const pendingRef = useRef(false);

  const runCeremony = useCallback(
    async (walletAddress: `0x${string}`) => {
      setError(null);
      try {
        setStatus("signing");
        const { data, error: nonceError } = (await authClient.siwe.nonce({
          walletAddress,
          chainId,
        })) as NonceResult;
        if (!data) throw nonceError ?? new Error("failed to get nonce");

        const message = createSiweMessage({
          domain: window.location.host,
          address: walletAddress,
          chainId,
          uri: window.location.origin,
          version: "1",
          nonce: data.nonce,
          statement: "Sign in to Anticapture.",
        });
        const signature = await signMessageAsync({ message });

        setStatus("verifying");
        const { error: verifyError } = await authClient.siwe.verify({
          message,
          signature,
          walletAddress,
          chainId,
        });
        if (verifyError) throw verifyError;

        // better-auth's bundled siweClient is a stub with no atomListeners,
        // so a successful verify does NOT refresh useSession's store — the
        // whole app would still read "signed out" until a full reload. Flip
        // the session signal to force the refetch; LoginProvider's session
        // watcher then closes the modal and runs the post-login redirect
        // once the fresh session actually lands in the store.
        authClient.$store.notify("$sessionSignal");

        // Stay in "verifying" until the watcher closes the modal. If the
        // session refetch fails, unstick the button so the user can retry.
        window.setTimeout(
          () => setStatus((s) => (s === "verifying" ? "idle" : s)),
          8000,
        );
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Sign-in failed");
      }
    },
    [chainId, signMessageAsync],
  );

  // Resume the ceremony once the wallet connects after login() opened the modal.
  useEffect(() => {
    if (pendingRef.current && isConnected && address) {
      pendingRef.current = false;
      void runCeremony(address);
    }
  }, [isConnected, address, runCeremony]);

  const login = useCallback(
    (openConnectModal: () => void) => {
      if (isConnected && address) {
        void runCeremony(address);
        return;
      }
      // Defer the ceremony until the wallet connects (effect above).
      pendingRef.current = true;
      setStatus("connecting");
      openConnectModal();
    },
    [isConnected, address, runCeremony],
  );

  const reset = useCallback(() => {
    pendingRef.current = false;
    setStatus("idle");
    setError(null);
  }, []);

  return { login, status, error, reset };
};
