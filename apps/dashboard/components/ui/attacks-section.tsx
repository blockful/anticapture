"use client";

import { useContext, useEffect, useState } from "react";
import { DaoDataContext } from "@/components/contexts/dao-data-provider";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AttacksIcon } from "@/components/01-atoms";
import { sanitizeNumber } from "@/lib/client/utils";
import { approxScaleBigInt } from "@namehash/ens-utils";

export const AttacksSection = () => {
  const { daoData, tokenPrice } = useContext(DaoDataContext);

  const [
    fiftyPercentPlusOneAverageTurnoutTokensCount,
    setFiftyPercentPlusOneAverageTurnoutTokensCount,
  ] = useState<null | bigint>(null);
  const [
    fiftyPercentPlusOneDelegatedTokensCount,
    setFiftyPercentPlusOneDelegatedTokensCount,
  ] = useState<null | bigint>(null);
  useEffect(() => {
    if (daoData) {
      setFiftyPercentPlusOneDelegatedTokensCount(
        (BigInt(daoData.totalVotingPower) / BigInt(2) + BigInt(1)) /
          BigInt(10) ** BigInt(18)
      );
    }
    if (tokenPrice && daoData) {
      setFiftyPercentPlusOneAverageTurnoutTokensCount(
        (BigInt(daoData.averageTurnout) / BigInt(2) + BigInt(1)) /
          BigInt(10) ** BigInt(18)
      );
    }
  }, [daoData, tokenPrice]);

  return (
    <div className="flex flex-col text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left border border-lightDark rounded-lg p-3">
      <div className="flex space-x-3 items-center pb-4">
        <AttacksIcon />
        <h1 className="text-lg text-white text-left font-medium">
          Attack Costs
        </h1>
      </div>
      <div className="bg-dark rounded-[4px] flex space-x-4">
        <div className="w-full flex flex-col">
          <h3 className="text-foreground text-sm p-4 pb-2">
            Delegates to Pass
          </h3>
          <div className="flex w-full justify-between p-4 pt-0">
            <div className="flex flex-col space-y-1 w-1/2">
              <p className="text-2xl font-semibold text-white flex justify-center lg:justify-start">
                Top{" "}
                {daoData ? (
                  <AnimatedNumber
                    num={
                      daoData.attackCosts.topActiveDelegatesForTotalVotingPower
                    }
                  />
                ) : (
                  <div className="bg-gray-200 h-8 w-6 rounded-md ml-1"></div>
                )}
              </p>
              <p className="text-xs text-foreground font-medium">
                based on active delegates
              </p>
            </div>
            <div className="flex flex-col space-y-1 w-1/2">
              <p className="text-2xl font-semibold text-white flex justify-center lg:justify-start">
                Top{" "}
                {daoData ? (
                  <AnimatedNumber
                    num={daoData.attackCosts.topDelegatesForActiveVotingPower}
                  />
                ) : (
                  <div className="bg-gray-200 h-8 w-6 rounded-md ml-1"></div>
                )}
              </p>
              <p className="text-xs text-foreground font-medium">
                based on all delegates
              </p>
            </div>
          </div>
          <div className="w-full border-t border-lightDark">
            <h3 className="text-foreground text-sm p-4 pb-2">Cost to Pass</h3>
            <div className="flex w-full justify-between p-4 pt-0">
              <div className="flex flex-col space-y-1 w-1/2 items-center lg:items-start">
                <p className="text-2xl font-semibold text-white">
                  {fiftyPercentPlusOneDelegatedTokensCount && tokenPrice ? (
                    <p className="text-3xl">
                      $
                      {sanitizeNumber(
                        Number(
                          approxScaleBigInt(
                            fiftyPercentPlusOneDelegatedTokensCount,
                            tokenPrice,
                            BigInt(2)
                          )
                        )
                      )}
                    </p>
                  ) : (
                    <div className="text-3xl flex space-x-2">
                      <p>$</p>
                      <div className="bg-gray-200 h-8 w-6 rounded-md"></div>
                    </div>
                  )}
                </p>
                <p className="text-xs text-foreground font-medium w-fit">
                  based on delegated supply
                </p>
              </div>
              <div className="flex flex-col space-y-1 w-1/2 items-center lg:items-start">
                <p className="text-2xl font-semibold text-white">
                  {fiftyPercentPlusOneAverageTurnoutTokensCount &&
                  tokenPrice ? (
                    <p className="text-3xl">
                      $
                      {sanitizeNumber(
                        Number(
                          approxScaleBigInt(
                            fiftyPercentPlusOneAverageTurnoutTokensCount,
                            tokenPrice,
                            BigInt(2)
                          )
                        )
                      )}
                    </p>
                  ) : (
                    <div className="text-3xl flex space-x-2">
                      <p>$</p>
                      <div className="bg-gray-200 h-8 w-6 rounded-md"></div>
                    </div>
                  )}
                </p>
                <p className="text-xs text-foreground font-medium">
                  based on average turnout
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
