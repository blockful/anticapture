"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { LoginModal } from "@/shared/components/auth/LoginModal";

export type OpenLoginOptions = {
  /** Route to navigate to once the user authenticates. */
  redirectTo?: string;
};

type LoginContextValue = {
  /** Opens the sign-in modal. */
  openLogin: (options?: OpenLoginOptions) => void;
  /** Closes the sign-in modal. */
  closeLogin: () => void;
  isOpen: boolean;
};

const LoginContext = createContext<LoginContextValue | null>(null);

export function LoginProvider({
  isWhitelabel = false,
  children,
}: {
  isWhitelabel?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  // Where to land after sign-in (login-gated pages pass their own route).
  // Cleared when the modal is dismissed without authenticating.
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const openLogin = useCallback((options?: OpenLoginOptions) => {
    setRedirectTo(options?.redirectTo ?? null);
    setIsOpen(true);
  }, []);
  const closeLogin = useCallback(() => setIsOpen(false), []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) setRedirectTo(null);
  }, []);

  const handleAuthenticated = useCallback(() => {
    if (redirectTo) router.push(redirectTo);
  }, [redirectTo, router]);

  const value = useMemo(
    () => ({ openLogin, closeLogin, isOpen }),
    [openLogin, closeLogin, isOpen],
  );

  return (
    <LoginContext.Provider value={value}>
      {children}
      <LoginModal
        open={isOpen}
        onOpenChange={handleOpenChange}
        isWhitelabel={isWhitelabel}
        onAuthenticated={handleAuthenticated}
        redirectTo={redirectTo}
      />
    </LoginContext.Provider>
  );
}

export function useLogin(): LoginContextValue {
  const ctx = useContext(LoginContext);
  if (!ctx) {
    throw new Error("useLogin must be used within LoginProvider");
  }
  return ctx;
}
