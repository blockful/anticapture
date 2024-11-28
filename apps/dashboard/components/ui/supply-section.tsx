"use client";

import { useContext, useEffect, useState } from "react";

import { DAO } from "@/lib/server/backend";

import { AnimatedNumber } from "./animated-number";
import { DaoDataContext } from "../contexts/dao-data-provider";
import { SupplyIcon } from "./supply-icon";

export const SupplySection = () => {
  const { daoData } = useContext(DaoDataContext);

  const [totalSupply, setTotalSupply] = useState<number | null>(null);
  const [totalVotingPower, setTotalVotingPower] = useState<number | null>(null);

  useEffect(() => {
    if (daoData) {
      setTotalSupply((daoData as DAO).totalSupply);
      setTotalVotingPower((daoData as DAO).totalVotingPower);
    }
  }, [daoData]);

  return (
    <div className="flex flex-col text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left border border-lightDark rounded-lg p-3">
      <div className="flex space-x-3 items-center pb-4">
        <SupplyIcon />
        <h1 className="text-lg text-white text-left font-medium">Supply</h1>
      </div>
      <div className="bg-dark rounded-[4px] flex flex-grow space-x-4">
        <div className="w-full flex flex-col">
          <h3 className="text-foreground text-sm p-4 pb-0 mb-2">
            Delegated Supply
          </h3>
          <div className="flex w-full justify-center lg:justify-start p-4 pt-0">
            <div className="flex flex-col space-y-1 w-1/2 justify-center lg:justify-start">
              <p className="text-2xl font-semibold text-white">
                {totalVotingPower && totalSupply ? (
                  <>
                    <AnimatedNumber
                      num={Math.round((totalVotingPower / totalSupply) * 100)}
                    />
                    %
                  </>
                ) : (
                  <div className="flex w-full justify-center lg:justify-start space-x-2">
                    <div className="bg-gray-200 h-8 w-6 rounded-md"></div>
                    <p>%</p>
                  </div>
                )}
              </p>
              <p className="text-xs text-foreground font-medium">
                of total supply
              </p>
            </div>
          </div>
          <div className="w-full border-t border-lightDark">
            <h3 className="text-foreground text-sm p-4 pb-2">Liquid Supply</h3>
            <div className="flex w-full p-4 pt-0">
              <div className="flex flex-col space-y-1 w-full items-center lg:items-start">
                <div className="bg-gray-200 h-8 w-6 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
