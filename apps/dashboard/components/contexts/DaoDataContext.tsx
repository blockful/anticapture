/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  ChainNameEnum,
  fetchDaoData,
  fetchTokenPrice,
} from "@/lib/server/backend";
import { DAO, DaoIdEnum } from "@/lib/types/daos";
import { createContext, useContext, useEffect, useState } from "react";

interface DaoDataContext {
  daoData: null | DAO;
  tokenPrice: null | number;
}

export const DaoDataCtx = createContext<DaoDataContext>({
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
    fetchTokenPrice(ChainNameEnum.Ethereum, daoId).then((tokenPrice) =>
      setTokenPrice(tokenPrice),
    );
  }, []);

  return (
    <DaoDataCtx.Provider value={{ daoData, tokenPrice }}>
      {children}
    </DaoDataCtx.Provider>
  );
};

export const useDaoDataContext = () => useContext(DaoDataCtx);
