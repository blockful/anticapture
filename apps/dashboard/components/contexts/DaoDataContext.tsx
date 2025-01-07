"use client";

import { ChainName, fetchDaoData, fetchTokenPrice } from "@/lib/server/backend";
import { DAO, DaoId } from "@/lib/types/daos";
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
  daoId,
}: {
  children: React.ReactNode;
  daoId: DaoId;
}) => {
  const [daoData, setDaoData] = useState<DAO | null>(null);
  const [tokenPrice, setTokenPrice] = useState<null | number>(null);

  useEffect(() => {
    fetchDaoData(daoId)
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
    fetchTokenPrice(ChainName.Ethereum, daoId).then((tokenPrice) =>
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
