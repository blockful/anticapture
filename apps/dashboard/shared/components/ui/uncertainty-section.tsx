"use client";

import { useEffect, useState } from "react";

import { AnimatedNumber } from "@/shared/components/ui/animated-number";
import { useDaoDataContext } from "@/contexts/DaoDataContext";
import { UncertaintyIcon } from "@/shared/components/icons";

export const UncertaintySection = () => {
  const { daoData } = useDaoDataContext();

  const [totalSupply, setTotalSupply] = useState<number | undefined>(undefined);
  const [inactiveVotingPower, setInactiveVotingPower] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (daoData) {
      setTotalSupply(daoData.totalSupply ?? undefined);
      // setInactiveVotingPower(
      //   (daoData as DAO).totalVotingPower - (daoData as DAO).activeVotingPower
      // );
    }
  }, [daoData]);

  return (
    <div className="flex flex-col rounded-lg border border-lightDark p-3 text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
      <div className="flex items-center space-x-3 pb-4">
        <UncertaintyIcon />
        <h1 className="text-left text-lg font-medium text-white">
          Uncertainty
        </h1>
      </div>
      <div className="flex flex-grow space-x-4 rounded-[4px] bg-dark p-4">
        <div className="flex flex-col">
          <h3 className="mb-2 text-sm text-foreground">Inactive delegations</h3>
          <div>
            <p className="pb-5 text-2xl font-semibold text-white">
              {inactiveVotingPower && totalSupply ? (
                <div className="flex space-x-2">
                  <p>
                    <AnimatedNumber num={inactiveVotingPower / totalSupply} />
                  </p>
                  <p>%</p>
                </div>
              ) : (
                <div className="flex space-x-1">
                  <div className="h-8 w-6 rounded-md bg-gray-200"></div>
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
