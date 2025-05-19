"use client";

import { createContext, useContext } from "react";
import { useDaoData } from "@/shared/hooks";
import { DAO, DaoIdEnum } from "@/shared/types/daos";

interface DaoDataContextProps {
  daoData: null | DAO;
}

export const DaoDataContext = createContext<DaoDataContextProps>({
  daoData: null,
});

export const DaoDataProvider = ({
  children,
  daoId,
}: {
  children: React.ReactNode;
  daoId: DaoIdEnum;
}) => {
  const { data: daoData } = useDaoData(daoId);

  return (
    <DaoDataContext.Provider
      value={{
        daoData,
      }}
    >
      {children}
    </DaoDataContext.Provider>
  );
};

export const useDaoDataContext = () => useContext(DaoDataContext);
