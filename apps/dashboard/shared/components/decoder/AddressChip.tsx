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
import { formatAddress } from "@/shared/utils/formatAddress";
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
 * checksum + copy, with an EOA tag for unresolved wallets. Replaces the old
 * regex-spliced address rendering in the flat decode block.
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

  const resolvedName =
    ens?.name ??
    (arkham?.entity && arkham?.label
      ? `${arkham.entity} · ${arkham.label}`
      : (arkham?.entity ?? arkham?.label ?? null));

  const shortAddress = formatAddress(address);

  const nameContent = (
    <span
      className={cn(
        "text-primary font-mono text-sm leading-5",
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
      className={cn(
        "bg-surface-default border-border-contrast inline-flex max-w-full items-center gap-1.5 border px-1 py-0.5",
        "hover:border-highlight transition-colors duration-[120ms] ease-[var(--ease-decoder)]",
        className,
      )}
    >
      {/* The tooltip trigger renders as a <button>, so it may only wrap the
          avatar: the copy control and the explorer link are interactive
          themselves and nesting them in a button is invalid HTML. */}
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
      {explorerUrl ? (
        <a
          href={`${explorerUrl}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {nameContent}
        </a>
      ) : (
        nameContent
      )}
      {!compact && resolvedName && (
        <span className="text-dimmed font-mono text-xs leading-4">
          {shortAddress}
        </span>
      )}
      {!compact && !resolvedName && isContract === false && (
        <span className="text-secondary font-mono text-xs uppercase leading-4">
          EOA
        </span>
      )}
      {!compact && (
        <CopyRawButton
          textToCopy={address}
          label="copy"
          className="uppercase"
        />
      )}
    </span>
  );
};
