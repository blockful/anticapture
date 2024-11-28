"use client";

import { useContext, useEffect, useState } from "react";

import { DAO } from "@/lib/backend";

import { AnimatedNumber } from "./animated-number";
import { DaoDataContext } from "../contexts/dao-data-provider";

export const InactiveDelegationsSection = () => {
  const { daoData } = useContext(DaoDataContext);

  const [totalSupply, setTotalSupply] = useState<number | null>(null);
  const [inactiveVotingPower, setInactiveVotingPower] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (daoData) {
      setTotalSupply((daoData as DAO).totalSupply);
      setInactiveVotingPower(
        (daoData as DAO).totalVotingPower - (daoData as DAO).activeVotingPower
      );
    }
  }, [daoData]);

  return (
    <div className="flex flex-col text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
      <h1 className="text-center w-full font-bold mb-10 border-b-4 pb-2 border-colored">
        Inactive delegations
      </h1>
      <div className="flex space-x-12 mx-auto">
        <div className="flex flex-col space-y-2 items-center bg-light rounded p-6">
          <p className="text-3xl">
            {inactiveVotingPower && totalSupply ? (
              <div className="flex space-x-2">
                <p>
                  <AnimatedNumber num={inactiveVotingPower / totalSupply} />
                </p>
                <p>%</p>
              </div>
            ) : (
              <div className="flex space-x-2">
                <div className="bg-gray-200 h-8 w-6 rounded-md"></div>
                <p>%</p>
              </div>
            )}
          </p>
          <p>of voting power</p>
        </div>
      </div>
    </div>
  );
};
