"use client";

import { useEffect, useState } from "react";

import { DAO } from "@/lib/types/daos";

import { AnimatedNumber } from "./animated-number";
import { useDaoDataContext } from "@/contexts/DaoDataContext";
import { SupplyIcon } from "@/components/01-atoms";

export const SupplySection = () => {
  const { daoData } = useDaoDataContext();

  const [totalSupply, setTotalSupply] = useState<number | undefined>(undefined);
  const [totalVotingPower, setTotalVotingPower] = useState<number | null>(null);

  useEffect(() => {
    if (daoData) {
      setTotalSupply(daoData.totalSupply ?? undefined);
      // setTotalVotingPower((daoData as DAO).totalVotingPower);
    }
  }, [daoData]);

  return (
    <div className="flex flex-col rounded-lg border border-lightDark p-3 text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
      <div className="flex items-center space-x-3 pb-4">
        <SupplyIcon />
        <h1 className="text-left text-lg font-medium text-white">Supply</h1>
      </div>
      <div className="flex flex-grow space-x-4 rounded-[4px] bg-dark">
        <div className="flex w-full flex-col">
          <h3 className="mb-2 p-4 pb-0 text-sm text-foreground">
            Delegated Supply
          </h3>
          <div className="flex w-full justify-center p-4 pt-0 lg:justify-start">
            <div className="flex w-1/2 flex-col justify-center space-y-1 lg:justify-start">
              <p className="text-2xl font-semibold text-white">
                {totalVotingPower && totalSupply ? (
                  <>
                    <AnimatedNumber
                      num={Math.round((totalVotingPower / totalSupply) * 100)}
                    />
                    %
                  </>
                ) : (
                  <div className="flex w-full justify-center space-x-2 lg:justify-start">
                    <div className="h-8 w-6 rounded-md bg-gray-200"></div>
                    <p>%</p>
                  </div>
                )}
              </p>
              <p className="text-xs font-medium text-foreground">
                of total supply
              </p>
            </div>
          </div>
          <div className="w-full border-t border-lightDark">
            <h3 className="p-4 pb-2 text-sm text-foreground">Liquid Supply</h3>
            <div className="flex w-full p-4 pt-0">
              <div className="flex w-full flex-col items-center space-y-1 lg:items-start">
                <div className="h-8 w-6 rounded-md bg-gray-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
