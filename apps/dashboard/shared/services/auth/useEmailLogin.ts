"use client";

import { useCallback, useState } from "react";

import { authClient } from "./client";

export type EmailLoginStatus = "idle" | "sending" | "sent" | "error";

/**
 * Sends a magic-link sign-in email via the User API. The link returns the user
 * to `callbackURL` (defaults to the page they started from), where the session
 * cookie is set.
 */
export const useEmailLogin = () => {
  const [status, setStatus] = useState<EmailLoginStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (email: string, callbackURL?: string): Promise<boolean> => {
      setStatus("sending");
      setError(null);
      const { error: sendError } = await authClient.signIn.magicLink({
        email,
        callbackURL: callbackURL ?? window.location.href,
      });
      if (sendError) {
        setStatus("error");
        setError(sendError.message ?? "Could not send the login link");
        return false;
      }
      setStatus("sent");
      return true;
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { send, status, error, reset };
};
