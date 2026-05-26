"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { DaoIdEnum } from "@/shared/types/daos";

const DaoIdContext = createContext<DaoIdEnum | null>(null);

export function DaoIdProvider({
  daoId,
  children,
}: {
  daoId: DaoIdEnum;
  children: ReactNode;
}) {
  return (
    <DaoIdContext.Provider value={daoId}>{children}</DaoIdContext.Provider>
  );
}

export function useDaoId(): DaoIdEnum {
  const daoId = useContext(DaoIdContext);

  if (!daoId) {
    throw new Error("useDaoId must be used within a DaoIdProvider");
  }

  return daoId;
}
