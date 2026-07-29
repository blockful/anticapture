"use client";

import { parseAsStringEnum, useQueryState } from "nuqs";
import type { Address } from "viem";

import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import type { EntityType } from "@/shared/types/entities";
import { cn } from "@/shared/utils/cn";

interface DrawerAddressButtonProps {
  address: Address;
  // Which kind of profile the clicked address stands for in its column, e.g. a
  // "Delegate" cell is a delegate even inside a token holder drawer. Required
  // so every table states it instead of silently inheriting the open drawer's
  // tabs.
  entityType: EntityType;
  nameClassName?: string;
}

// Any address rendered inside the profile drawer is clickable: it closes the
// current drawer and opens the profile of the clicked address (DEV-562 item 1).
export const DrawerAddressButton = ({
  address,
  entityType,
  nameClassName,
}: DrawerAddressButtonProps) => {
  const setDrawerAddress = useQueryState("drawerAddress")[1];
  const setDrawerTab = useQueryState("drawerTab")[1];
  const setTabAddress = useQueryState("tabAddress")[1];
  // Same channel the drawer's activity feed uses to re-point the drawer at
  // another kind of profile; HoldersAndDelegatesDrawer reads it as an override
  // of the entity type its opener passed and clears it on close.
  const setDrawerEntity = useQueryState(
    "drawerEntity",
    parseAsStringEnum<EntityType>(["delegate", "tokenHolder"]),
  )[1];

  return (
    <button
      type="button"
      // Clamped to the cell: a button is inline-block, so without this it is
      // sized by its content and long names (an ENS record can be a 42 char
      // address plus ".eth") overflow into the next column instead of being
      // truncated.
      className="min-w-0 max-w-full cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setTabAddress(null);
        setDrawerTab(null);
        setDrawerEntity(entityType);
        setDrawerAddress(address);
      }}
    >
      <EnsAvatar
        address={address}
        size="sm"
        variant="rounded"
        isDashed={true}
        nameClassName={cn("hover:border-primary", nameClassName)}
        // This button is already the interactive element; the tooltip would add
        // a nested button, a second tab stop and the wrong accessible name.
        withDetailsTooltip={false}
      />
    </button>
  );
};
