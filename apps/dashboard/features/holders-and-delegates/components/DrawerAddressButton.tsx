"use client";

import { useQueryState } from "nuqs";
import type { Address } from "viem";

import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { cn } from "@/shared/utils/cn";

interface DrawerAddressButtonProps {
  address: Address;
  nameClassName?: string;
}

// Any address rendered inside the profile drawer is clickable: it closes the
// current drawer and opens the profile of the clicked address (DEV-562 item 1).
export const DrawerAddressButton = ({
  address,
  nameClassName,
}: DrawerAddressButtonProps) => {
  const setDrawerAddress = useQueryState("drawerAddress")[1];
  const setDrawerTab = useQueryState("drawerTab")[1];
  const setTabAddress = useQueryState("tabAddress")[1];

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
        setDrawerAddress(address);
      }}
    >
      <EnsAvatar
        address={address}
        size="sm"
        variant="rounded"
        isDashed={true}
        nameClassName={cn("hover:border-primary", nameClassName)}
      />
    </button>
  );
};
