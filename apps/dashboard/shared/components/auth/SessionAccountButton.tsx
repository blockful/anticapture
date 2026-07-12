"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { isAddress } from "viem";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { authClient } from "@/shared/services/auth/client";
import { cn } from "@/shared/utils/cn";

type SessionUser = {
  name: string;
  email: string;
  image?: string | null;
};

const shortAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

/**
 * Account chip for platform sessions that have no connected wallet (magic
 * link / Google): an avatar — the user's picture when the provider gave one,
 * otherwise their initial — opening a popover with the account identity and
 * sign-out. Wallet sessions keep the RainbowKit chip instead.
 */
export const SessionAccountButton = ({
  user,
  className,
}: {
  user: SessionUser;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // SIWE users carry their wallet address as the name; email users may have
  // no name at all, in which case the email is their identity.
  const displayName = !user.name
    ? user.email
    : isAddress(user.name)
      ? shortAddress(user.name)
      : user.name;
  const initial = (displayName || "?").trim().charAt(0).toUpperCase();

  const signOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      setOpen(false);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          className={cn("btn-connect-wallet", className)}
          aria-label={`Account: ${displayName}`}
        >
          {user.image ? (
            <div className="relative size-6 overflow-hidden rounded-full">
              <Image
                src={user.image}
                alt={displayName}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <span className="bg-surface-action text-inverted flex size-6 items-center justify-center rounded-full text-xs font-semibold">
              {initial}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-60 p-3">
        <div className="flex flex-col gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-primary truncate text-sm font-medium">
              {displayName}
            </span>
            {/* Wallet-born users carry a synthetic <address>@<origin>
                placeholder email — never show it as an identity. */}
            {user.email &&
              user.email !== displayName &&
              !user.email.includes("@http") && (
                <span className="text-secondary truncate text-xs">
                  {user.email}
                </span>
              )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            loading={signingOut}
            loadingText="Signing out…"
            onClick={() => void signOut()}
          >
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
