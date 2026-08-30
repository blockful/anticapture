"use client";

import type { Address } from "viem";

import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
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
        "font-mono text-sm leading-5",
        resolvedName ? "text-primary" : "text-secondary",
        isLoading && "animate-pulse",
      )}
    >
      {resolvedName ?? shortAddress}
    </span>
  );

  const chip = (
    <span
      className={cn(
        "bg-surface-default inline-flex max-w-full items-center gap-1.5 border border-transparent px-1 py-0.5",
        "hover:border-border-contrast transition-colors duration-[120ms]",
        className,
      )}
    >
      <EnsAvatar
        address={address}
        size={size}
        variant="square"
        showName={false}
        withDetailsTooltip={false}
      />
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
      {resolvedName && (
        <span className="text-dimmed font-mono text-xs leading-4">
          {shortAddress}
        </span>
      )}
      {!resolvedName && isContract === false && (
        <span className="text-dimmed border-border-contrast border px-1 font-mono text-xs uppercase leading-4">
          EOA
        </span>
      )}
      <CopyAndPasteButton
        textToCopy={address}
        iconSize="md"
        className="p-0.5"
        feedbackDurationMs={1200}
        customTooltipText={{ default: "Copy address", copied: "copied ✓" }}
      />
    </span>
  );

  return (
    <>
      <span className="hidden md:contents">
        <AddressDetailsTooltip
          address={address}
          arkhamData={arkham}
          ens={ens}
          isContract={isContract}
          isLoading={isLoading}
        >
          {chip}
        </AddressDetailsTooltip>
      </span>
      <span className="contents md:hidden">{chip}</span>
    </>
  );
};
