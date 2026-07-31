"use client";

import { createContext, useContext } from "react";

export interface DrawerNavigation {
  // The clicked entity type travels separately, through the URL override the
  // drawer already reads, so only the address is handed over here.
  repoint: (address: string) => void;
}

export const DrawerNavigationContext = createContext<DrawerNavigation | null>(
  null,
);

/**
 * Re-points the open drawer at another profile. Not every owner keeps the
 * drawer's address in the URL (the DAO overview chart and the activity feed
 * hold it in local state), so writing `drawerAddress` alone would leave those
 * drawers on the previous profile. Null outside a drawer, where the URL state
 * is the only thing to update.
 */
export const useDrawerNavigation = () => useContext(DrawerNavigationContext);
