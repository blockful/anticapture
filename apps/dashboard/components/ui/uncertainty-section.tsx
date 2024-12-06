"use client";

import { useContext, useEffect, useState } from "react";

import { DAO } from "@/lib/server/backend";

import { AnimatedNumber } from "./animated-number";
import { DaoDataContext } from "@/components/contexts/dao-data-provider";
import { UncertaintyIcon } from "@/components/01-atoms";

export const UncertaintySection = () => {
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
    <div className="flex flex-col text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left border border-lightDark rounded-lg p-3">
      <div className="flex space-x-3 items-center pb-4">
        <UncertaintyIcon />
        <h1 className="text-lg text-white text-left font-medium">
          Uncertainty
        </h1>
      </div>
      <div className="bg-dark rounded-[4px] p-4 flex space-x-4 flex-grow">
        <div className="flex flex-col">
          <h3 className="text-foreground text-sm mb-2">Inactive delegations</h3>
          <div>
            <p className="text-2xl font-semibold text-white pb-5">
              {inactiveVotingPower && totalSupply ? (
                <div className="flex space-x-2">
                  <p>
                    <AnimatedNumber num={inactiveVotingPower / totalSupply} />
                  </p>
                  <p>%</p>
                </div>
              ) : (
                <div className="flex space-x-1">
                  <div className="bg-gray-200 h-8 w-6 rounded-md"></div>
                  <p>%</p>
                </div>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
