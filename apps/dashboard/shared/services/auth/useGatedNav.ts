"use client";

import { useCallback, type MouseEvent } from "react";

import { useSession } from "@/shared/services/auth/client";
import { useLogin } from "@/shared/services/auth/LoginProvider";

/**
 * Click guard for login-gated nav entries, shared by every header. Only a
 * present session navigates: signed-out (or still resolving) prevents the
 * navigation and opens the sign-in modal; if the session resolves signed-in
 * a moment later, LoginProvider closes the modal and completes the
 * navigation via redirectTo. Returns true when the click was intercepted.
 */
export const useGatedNavClick = () => {
  const { data: session } = useSession();
  const { openLogin } = useLogin();

  return useCallback(
    (e: MouseEvent, page: string): boolean => {
      if (session) return false;
      e.preventDefault();
      openLogin({ redirectTo: `/${page}` });
      return true;
    },
    [session, openLogin],
  );
};
