"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import type { Address } from "viem";

import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { useAddressProfileHref } from "@/shared/hooks/useAddressProfileHref";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";

type EnsAvatarProps = ComponentProps<typeof EnsAvatar>;

type AddressLinkProps = Pick<
  EnsAvatarProps,
  | "size"
  | "variant"
  | "nameClassName"
  | "containerClassName"
  | "addressChars"
  | "showAvatar"
  | "isDashed"
  | "subtitle"
> & {
  address: string;
  /** Defaults to the DAO of the current page. */
  daoId?: DaoIdEnum;
  /** Custom content; defaults to the address avatar and name. */
  children?: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * The one way an address is rendered as a link: a real anchor to the address
 * profile of the current DAO, in whichever shell the page belongs to, so it
 * opens in a new tab and is reachable by keyboard. Falls back to plain content
 * when there is no profile to link to (no DAO in scope, zero address).
 */
export const AddressLink = ({
  address,
  daoId,
  children,
  className,
  onClick,
  size = "sm",
  variant = "rounded",
  isDashed = true,
  nameClassName,
  ...avatarProps
}: AddressLinkProps) => {
  const href = useAddressProfileHref(address, daoId);

  const content = children ?? (
    <EnsAvatar
      address={address as Address}
      size={size}
      variant={variant}
      isDashed={isDashed && !!href}
      nameClassName={cn(
        href && "group-hover/address-link:border-primary",
        nameClassName,
      )}
      // The link is already the interactive element; the tooltip trigger is a
      // button, and nesting it inside an anchor is invalid HTML. The profile it
      // leads to shows the same details.
      withDetailsTooltip={false}
      {...avatarProps}
    />
  );

  if (!href) {
    return (
      <span className={cn("inline-flex min-w-0 max-w-full", className)}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      // Tables render dozens of these; prefetching every profile would fire a
      // request per row for pages most visitors never open.
      prefetch={false}
      className={cn(
        "group/address-link inline-flex min-w-0 max-w-full outline-none focus-visible:shadow-[var(--shadow-focus-ring)]",
        className,
      )}
      onClick={(event) => {
        // Rows and cards that host a link often have their own click handler.
        event.stopPropagation();
        onClick?.(event);
      }}
    >
      {content}
    </Link>
  );
};
