"use client";

import { Coins } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { Address } from "viem";

import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { DaoAvatarIcon } from "@/shared/components/icons/DaoAvatarIcon";
import daoConfigByDaoId from "@/shared/dao-config";
import type { KnownIdentity } from "@/shared/services/decoder/knownIdentities";
import { cn } from "@/shared/utils/cn";

interface IdentityAvatarProps {
  address: Address;
  identity?: KnownIdentity;
  className?: string;
}

/**
 * The glyph on an identity chip: a DAO's own logo for its token and
 * governance contracts, the token logo for curated ERC-20s, and the ENS
 * avatar or identicon for everything else. A token whose logo does not load
 * falls back to a neutral coin glyph, never to an identicon that would read
 * as a wallet.
 */
export const IdentityAvatar = ({
  address,
  identity,
  className,
}: IdentityAvatarProps) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const box = cn(
    "flex size-5 shrink-0 overflow-hidden rounded-full",
    className,
  );

  if (identity?.daoId && daoConfigByDaoId[identity.daoId]?.icon) {
    return (
      <DaoAvatarIcon
        daoId={identity.daoId}
        isRounded
        width={20}
        height={20}
        className={box}
        aria-label={identity.label}
      />
    );
  }

  if (identity?.isToken) {
    if (identity.logoUri && !logoFailed) {
      return (
        <span className={cn(box, "bg-surface-hover")}>
          <Image
            src={identity.logoUri}
            alt={identity.label}
            width={20}
            height={20}
            className="size-full object-cover"
            onError={() => setLogoFailed(true)}
            unoptimized
          />
        </span>
      );
    }
    return (
      <span
        aria-label={identity.label}
        className={cn(
          box,
          "bg-surface-hover text-secondary flex items-center justify-center",
        )}
      >
        <Coins className="size-3" aria-hidden="true" />
      </span>
    );
  }

  return (
    <EnsAvatar
      address={address}
      size="xs"
      variant="rounded"
      showName={false}
      withDetailsTooltip={false}
      className={box}
    />
  );
};
