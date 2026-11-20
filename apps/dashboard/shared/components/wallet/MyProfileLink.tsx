"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { useAddressProfileHref } from "@/shared/hooks/useAddressProfileHref";
import { cn } from "@/shared/utils/cn";

type MyProfileLinkProps = {
  /** `icon` for tight headers, `label` where there is room for the text. */
  variant?: "icon" | "label";
  className?: string;
  onClick?: () => void;
};

/**
 * Shortcut from the connected wallet to its own profile in the current DAO.
 * Renders nothing without a wallet or outside a DAO page.
 */
export const MyProfileLink = ({
  variant = "icon",
  className,
  onClick,
}: MyProfileLinkProps) => {
  const { address, isConnected } = useAccount();
  const href = useAddressProfileHref(isConnected ? address : null);

  if (!href) return null;

  return (
    <Button
      asChild
      variant="outline"
      size="md"
      className={cn(variant === "icon" && "px-2.5", className)}
    >
      <Link
        href={href}
        aria-label="My profile"
        title="My profile"
        onClick={onClick}
        data-umami-event="my_profile_shortcut"
      >
        <UserRound className="size-3.5" />
        {variant === "label" && "My profile"}
      </Link>
    </Button>
  );
};
