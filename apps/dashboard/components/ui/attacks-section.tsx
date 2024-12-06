"use client";

import { useContext, useEffect, useState } from "react";
import { DaoDataContext } from "@/components/contexts/dao-data-provider";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AttacksIcon } from "@/components/01-atoms";
import { sanitizeNumber } from "@/lib/client/utils";
import { approxScaleBigInt } from "@namehash/ens-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { InfoIcon } from "./info-icon";

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
          BigInt(10) ** BigInt(18),
      );
    }
    if (tokenPrice && daoData) {
      setFiftyPercentPlusOneAverageTurnoutTokensCount(
        (BigInt(daoData.averageTurnout) / BigInt(2) + BigInt(1)) /
          BigInt(10) ** BigInt(18),
      );
    }
  }, [daoData, tokenPrice]);

  return (
    <div className="flex flex-col rounded-lg border border-lightDark p-3 text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
      <div className="flex items-center space-x-3 pb-4">
        <AttacksIcon />
        <h1 className="text-left text-lg font-medium text-white">
          Attack Costs
        </h1>
      </div>
      <div className="bg-dark rounded-[4px] flex space-x-4">
        <div className="w-full flex flex-col">
          <div className="flex space-x-1.5 items-center mb-2">
            <h3 className="text-foreground text-sm p-4 pb-2">
              Delegates to Pass
            </h3>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon />
              </TooltipTrigger>
              <TooltipContent className="bg-dark border-foreground m-1">
                <p className="text-white"></p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex w-full justify-between p-4 pt-0">
            <div className="flex w-1/2 flex-col space-y-1">
              <p className="flex justify-center text-2xl font-semibold text-white lg:justify-start">
                Top{" "}
                {daoData && daoData.attackCosts ? (
                  <AnimatedNumber
                    num={
                      daoData.attackCosts.topActiveDelegatesForTotalVotingPower
                    }
                  />
                ) : (
                  <div className="ml-1 h-8 w-6 rounded-md bg-gray-200"></div>
                )}
              </p>
              <p className="text-xs font-medium text-foreground">
                based on active delegates
              </p>
            </div>
            <div className="flex w-1/2 flex-col space-y-1">
              <p className="flex justify-center text-2xl font-semibold text-white lg:justify-start">
                Top{" "}
                {daoData && daoData.attackCosts ? (
                  <AnimatedNumber
                    num={daoData.attackCosts.topDelegatesForActiveVotingPower}
                  />
                ) : (
                  <div className="ml-1 h-8 w-6 rounded-md bg-gray-200"></div>
                )}
              </p>
              <p className="text-xs font-medium text-foreground">
                based on all delegates
              </p>
            </div>
          </div>
          <div className="w-full border-t border-lightDark">
            <h3 className="p-4 pb-2 text-sm text-foreground">Cost to Pass</h3>
            <div className="flex w-full justify-between p-4 pt-0">
              <div className="flex w-1/2 flex-col items-center space-y-1 lg:items-start">
                <p className="text-2xl font-semibold text-white">
                  {fiftyPercentPlusOneDelegatedTokensCount && tokenPrice ? (
                    <p className="text-3xl">
                      $
                      {sanitizeNumber(
                        Number(
                          approxScaleBigInt(
                            fiftyPercentPlusOneDelegatedTokensCount,
                            tokenPrice,
                            BigInt(2),
                          ),
                        ),
                      )}
                    </p>
                  ) : (
                    <div className="flex space-x-2 text-3xl">
                      <p>$</p>
                      <div className="h-8 w-6 rounded-md bg-gray-200"></div>
                    </div>
                  )}
                </p>
                <p className="w-fit text-xs font-medium text-foreground">
                  based on delegated supply
                </p>
              </div>
              <div className="flex w-1/2 flex-col items-center space-y-1 lg:items-start">
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
                            BigInt(2),
                          ),
                        ),
                      )}
                    </p>
                  ) : (
                    <div className="flex space-x-2 text-3xl">
                      <p>$</p>
                      <div className="h-8 w-6 rounded-md bg-gray-200"></div>
                    </div>
                  )}
                </p>
                <p className="text-xs font-medium text-foreground">
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
