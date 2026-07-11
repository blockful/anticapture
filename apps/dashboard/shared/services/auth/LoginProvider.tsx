"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { LoginModal } from "@/shared/components/auth/LoginModal";

type LoginContextValue = {
  /** Opens the sign-in modal. */
  openLogin: () => void;
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
  const [isOpen, setIsOpen] = useState(false);

  const openLogin = useCallback(() => setIsOpen(true), []);
  const closeLogin = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ openLogin, closeLogin, isOpen }),
    [openLogin, closeLogin, isOpen],
  );

  return (
    <LoginContext.Provider value={value}>
      {children}
      <LoginModal
        open={isOpen}
        onOpenChange={setIsOpen}
        isWhitelabel={isWhitelabel}
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
