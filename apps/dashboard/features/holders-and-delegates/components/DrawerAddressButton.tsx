"use client";

import { useQueryState } from "nuqs";
import type { Address } from "viem";

import { useDrawerEntityOverride } from "@/features/holders-and-delegates/hooks/useDrawerEntityOverride";
import { useDrawerNavigation } from "@/features/holders-and-delegates/hooks/useDrawerNavigation";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import type { EntityType } from "@/shared/types/entities";
import { cn } from "@/shared/utils/cn";

interface DrawerAddressButtonProps {
  address: Address;
  // Which kind of profile the address stands for in its column: a "Delegate"
  // cell is a delegate even inside a token holder drawer.
  entityType: EntityType;
  nameClassName?: string;
  // Chars kept on each side of the "..." when there's no ENS name to show instead.
  addressChars?: number;
}

// Any address rendered inside the profile drawer is clickable: it re-points the
// drawer at the profile of the clicked address.
export const DrawerAddressButton = ({
  address,
  entityType,
  nameClassName,
  addressChars,
}: DrawerAddressButtonProps) => {
  const setDrawerAddress = useQueryState("drawerAddress")[1];
  const setDrawerTab = useQueryState("drawerTab")[1];
  const setTabAddress = useQueryState("tabAddress")[1];
  const { setDrawerEntity } = useDrawerEntityOverride();
  // `drawerAddress` re-points the owners that read it from the URL; the drawer
  // itself covers the ones holding the address in local state.
  const navigation = useDrawerNavigation();

  return (
    <button
      type="button"
      // Clamped to the cell: a button is inline-block, so without this long
      // names overflow into the next column instead of being truncated.
      className="min-w-0 max-w-full cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setTabAddress(null);
        setDrawerTab(null);
        setDrawerEntity(entityType, address);
        setDrawerAddress(address);
        navigation?.repoint(address);
      }}
    >
      <EnsAvatar
        address={address}
        size="sm"
        variant="rounded"
        isDashed={true}
        addressChars={addressChars}
        nameClassName={cn("hover:border-primary", nameClassName)}
        // This button is already the interactive element; the tooltip trigger
        // would nest a second button inside it.
        withDetailsTooltip={false}
      />
    </button>
  );
};
