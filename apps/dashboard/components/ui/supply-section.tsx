"use client";

import { useContext, useEffect, useState } from "react";

import { DAO } from "@/lib/backend";

import { AnimatedNumber } from "./animated-number";
import { DaoDataContext } from "../contexts/dao-data-provider";

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
    <div className="flex flex-col text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
      <h1 className="text-center w-full font-bold mb-10 border-b-4 pb-2 border-colored">
        Delegated supply
      </h1>
      <div className="flex space-x-24 mx-auto">
        <div className="flex flex-col space-y-2 items-center bg-light rounded p-6">
          <div className="text-3xl">
            {totalVotingPower && totalSupply ? (
              <>
                <AnimatedNumber
                  num={Math.round((totalVotingPower / totalSupply) * 100)}
                />
                %
              </>
            ) : (
              <div className="flex space-x-2">
                <div className="bg-gray-200 h-8 w-6 rounded-md"></div>
                <p>%</p>
              </div>
            )}
          </div>
          <p>of total supply</p>
        </div>
      </div>
    </div>
  );
};
