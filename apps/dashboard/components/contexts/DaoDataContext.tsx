/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useDaoData } from "@/hooks/useDaoData";
import { ChainNameEnum, fetchTokenPrice } from "@/lib/server/backend";
import { DAO, DaoIdEnum } from "@/lib/types/daos";

interface DaoDataContextProps {
  daoData: null | DAO;
  tokenPrice: null | number;
}

export const DaoDataContext = createContext<DaoDataContextProps>({
  daoData: null,
  tokenPrice: null,
});

export const DaoDataProvider = ({
  children,
  daoId,
}: {
  children: React.ReactNode;
  daoId: DaoIdEnum;
}) => {
  const { data: daoData } = useDaoData(daoId);
  const [tokenPrice, setTokenPrice] = useState<null | number>(null);

  useEffect(() => {
    fetchTokenPrice(ChainNameEnum.Ethereum, daoId).then((tokenPrice) =>
      setTokenPrice(tokenPrice),
    );
  }, []);

  return (
    <DaoDataContext.Provider value={{ daoData, tokenPrice }}>
      {children}
    </DaoDataContext.Provider>
  );
};

export const useDaoDataContext = () => useContext(DaoDataContext);
