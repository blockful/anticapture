"use client";

import { ChainName, fetchDaoData, fetchTokenPrice } from "@/lib/server/backend";
import { DAO, DaoName } from "@/lib/types/daos";
import { createContext, useContext, useEffect, useState } from "react";

interface DaoDataContext {
  daoData: null | DAO;
  tokenPrice: null | number;
}

export const DaoDataContext = createContext<DaoDataContext>({
  daoData: null,
  tokenPrice: null,
});

export const DaoDataProvider = ({
  children,
  daoName,
}: {
  children: React.ReactNode;
  daoName: DaoName;
}) => {
  const [daoData, setDaoData] = useState<DAO | null>(null);
  const [tokenPrice, setTokenPrice] = useState<null | number>(null);

  useEffect(() => {
    fetchDaoData(daoName)
      .then((uniData) => {
        try {
          return (uniData as Response).json();
        } catch (e) {
          console.error(e);
        }
      })
      .then((uniData: unknown) => {
        setDaoData(uniData as DAO);
      });
  }, []);

  useEffect(() => {
    fetchTokenPrice(ChainName.Ethereum, DaoName.UNISWAP).then((tokenPrice) =>
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
