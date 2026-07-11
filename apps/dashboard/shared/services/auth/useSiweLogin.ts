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
 * the wallet connects.
 */
export const useSiweLogin = (onSuccess?: () => void) => {
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

        setStatus("idle");
        onSuccess?.();
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Sign-in failed");
      }
    },
    [chainId, signMessageAsync, onSuccess],
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
