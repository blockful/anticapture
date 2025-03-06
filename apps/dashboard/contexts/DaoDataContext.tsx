/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { createContext, useContext } from "react";
import { useDaoData } from "@/hooks/useDaoData";
import { DAO, DaoIdEnum } from "@/lib/types/daos";

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
