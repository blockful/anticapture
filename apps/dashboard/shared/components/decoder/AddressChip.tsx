"use client";

import type { Address } from "viem";

import { CopyRawButton } from "@/shared/components/decoder/CopyRawButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { AddressDetailsTooltip } from "@/shared/components/tooltips/AddressDetailsTooltip";
import {
  ADDRESS_ENRICHMENT_GC_TIME,
  ADDRESS_ENRICHMENT_STALE_TIME,
} from "@/shared/constants/api";
import { cn } from "@/shared/utils/cn";
import { shortHex } from "@/shared/utils/shortHex";
import { useGetAddress } from "@anticapture/client/hooks";

interface AddressChipProps {
  address: Address;
  /** Enables the "view on explorer" click-through on the name. */
  explorerUrl?: string;
  size?: "xs" | "sm";
  /** Avatar + name only (collapsed rows), per frame 08's `[◉ USDC]` chip. */
  compact?: boolean;
  className?: string;
}

/**
 * Identity chip for decoded addresses: identicon + resolved name + truncated
 * checksum + copy, with an EOA tag for unresolved wallets.
 *
 * The chip is a flex item that negotiates width with its row: the name is
 * the only part allowed to shrink (and it ellipsizes), everything else is
 * fixed, and nothing ever wraps to a second line. Callers place it in a flex
 * container with `min-w-0` so that negotiation can happen. The checksum next
 * to a resolved name only appears when the enclosing `@container` (card body
 * or params box) is at least 36rem wide; narrower columns keep name + copy.
 */
export const AddressChip = ({
  address,
  explorerUrl,
  size = "xs",
  compact = false,
  className,
}: AddressChipProps) => {
  // Same query key as EnsAvatar, so chips and avatars share one cache entry.
  const { data, isLoading } = useGetAddress(address, {
    query: {
      staleTime: ADDRESS_ENRICHMENT_STALE_TIME,
      gcTime: ADDRESS_ENRICHMENT_GC_TIME,
    },
  });
  const ens = data?.ens ?? null;
  const arkham = data?.arkham ?? null;
  const isContract = data?.isContract ?? null;

  // Shortest useful name: an ENS name, else the Arkham label ("USD Coin
  // Token (USDC)"), else the entity ("Circle"). Never "entity · label": the
  // chip has one line and the tooltip carries the rest.
  const resolvedName = ens?.name ?? arkham?.label ?? arkham?.entity ?? null;

  // Same 6+4 middle truncation as the summary sentence, so the two never
  // show the same address with different glyphs.
  const shortAddress = shortHex(address, 6, 4);

  const nameContent = (
    <span
      className={cn(
        "text-primary block min-w-0 truncate font-mono text-sm leading-5",
        isLoading && "animate-pulse",
      )}
    >
      {resolvedName ?? shortAddress}
    </span>
  );

  const avatar = (
    <EnsAvatar
      address={address}
      size={size}
      variant="square"
      showName={false}
      withDetailsTooltip={false}
    />
  );

  return (
    <span
      title={resolvedName ? `${resolvedName} · ${address}` : address}
      className={cn(
        "bg-surface-default border-border-contrast flex min-w-0 max-w-full items-center gap-1.5 whitespace-nowrap border px-1 py-0.5",
        "hover:border-highlight transition-colors duration-[120ms] ease-[var(--ease-decoder)]",
        className,
      )}
    >
      {/* The tooltip trigger renders as a <button>, so it may only wrap the
          avatar: the copy control and the explorer link are interactive
          themselves and nesting them in a button is invalid HTML. */}
      <span className="flex shrink-0 items-center">
        <span className="hidden md:contents">
          <AddressDetailsTooltip
            address={address}
            arkhamData={arkham}
            ens={ens}
            isContract={isContract}
            isLoading={isLoading}
          >
            {avatar}
          </AddressDetailsTooltip>
        </span>
        <span className="contents md:hidden">{avatar}</span>
      </span>
      {explorerUrl ? (
        <a
          href={`${explorerUrl}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 hover:underline"
        >
          {nameContent}
        </a>
      ) : (
        nameContent
      )}
      {!compact && resolvedName && (
        <span className="text-dimmed @xl:inline hidden shrink-0 font-mono text-xs leading-4">
          {shortAddress}
        </span>
      )}
      {!compact && !resolvedName && isContract === false && (
        <span className="text-secondary shrink-0 font-mono text-xs uppercase leading-4">
          EOA
        </span>
      )}
      {!compact && (
        <CopyRawButton textToCopy={address} label="copy" className="shrink-0" />
      )}
    </span>
  );
};
