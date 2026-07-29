"use client";

import { useQueryState } from "nuqs";

import type { EntityType } from "@/shared/types/entities";

// The profile drawer takes its entity type from whoever opened it, but an
// address clicked inside the drawer can stand for the other kind of profile, so
// the clicked type has to survive in the URL. It is recorded together with the
// address it belongs to, as `<entityType>:<address>`, so it self-invalidates:
// any path that re-points `drawerAddress` without touching this param simply
// stops matching and the drawer falls back to its own entity type. That beats
// clearing the param in every cleanup path, which silently breaks again the
// next time someone adds one.
const DRAWER_ENTITY_PARAM = "drawerEntity";

const isEntityType = (value: string): value is EntityType =>
  value === "delegate" || value === "tokenHolder";

export const useDrawerEntityOverride = () => {
  const [override, setOverride] = useQueryState(DRAWER_ENTITY_PARAM);

  return {
    // Addresses reach this from tables, charts and the feed, so casing is not
    // guaranteed on either side of the comparison.
    setDrawerEntity: (entityType: EntityType, address: string) =>
      setOverride(`${entityType}:${address.toLowerCase()}`),

    clearDrawerEntity: () => setOverride(null),

    drawerEntityFor: (address: string): EntityType | null => {
      if (!override) return null;
      const separator = override.indexOf(":");
      if (separator < 0) return null;
      const entityType = override.slice(0, separator);
      const recordedAddress = override.slice(separator + 1);
      if (!isEntityType(entityType)) return null;
      if (recordedAddress !== address.toLowerCase()) return null;
      return entityType;
    },
  };
};
