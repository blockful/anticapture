/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useDaoData } from "@/hooks/useDaoData";
import { useTokenPrice } from "@/hooks/useTokenPrice";
import { ChainNameEnum } from "@/lib/dao-constants/types";
import { DAO, DaoIdEnum } from "@/lib/types/daos";

interface DaoDataContextProps {
  daoData: null | DAO;
  tokenPrice: null | number;
  isLoadingTokenPrice: boolean;
  tokenPriceError: Error | null;
}

export const DaoDataContext = createContext<DaoDataContextProps>({
  daoData: null,
  tokenPrice: null,
  isLoadingTokenPrice: false,
  tokenPriceError: null,
});

export const DaoDataProvider = ({
  children,
  daoId,
}: {
  children: React.ReactNode;
  daoId: DaoIdEnum;
}) => {
  const { data: daoData } = useDaoData(daoId);
  const {
    price: tokenPrice,
    loading: isLoadingTokenPrice,
    error: tokenPriceError,
  } = useTokenPrice(ChainNameEnum.Ethereum, daoId);

  return (
    <DaoDataContext.Provider
      value={{
        daoData,
        tokenPrice,
        isLoadingTokenPrice,
        tokenPriceError,
      }}
    >
      {children}
    </DaoDataContext.Provider>
  );
};

export const useDaoDataContext = () => useContext(DaoDataContext);
