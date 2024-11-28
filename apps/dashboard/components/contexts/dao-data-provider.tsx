"use client";

import {
  DAO,
  DaoName,
  ChainName,
  fetchDaoData,
  fetchTokenPrice,
} from "@/lib/backend";
import { createContext, useEffect, useState } from "react";

interface DaoDataContext {
  daoData: null | DAO;
  tokenPrice: null | number;
}

export const DaoDataContext = createContext<DaoDataContext>({
  daoData: null,
  tokenPrice: null,
});

const ACTIVE_SINCE = 1642002717;
const AVG_FROM_DATE = 1642002717;

export const DaoDataProvider = ({
  children,
  daoName,
}: {
  children: JSX.Element;
  daoName: DaoName;
}) => {
  const [daoData, setDaoData] = useState<DAO | null>(null);

  useEffect(() => {
    fetchDaoData(daoName, ACTIVE_SINCE, AVG_FROM_DATE)
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

  const [tokenPrice, setTokenPrice] = useState<null | number>(null);

  useEffect(() => {
    fetchTokenPrice(ChainName.Ethereum, DaoName.UNISWAP).then((tokenPrice) =>
      setTokenPrice(tokenPrice)
    );
  }, []);

  return (
    <DaoDataContext.Provider value={{ daoData, tokenPrice }}>
      {children}
    </DaoDataContext.Provider>
  );
};
