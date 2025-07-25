"use client";

import { TooltipInfo } from "@/shared/components";
import { Card } from "@/shared/components/ui/card";
import { SupportersCarroussel } from "@/shared/components/carroussels/SupportersCarroussel";
import { PetitionResponse } from "@/features/show-support/hooks";
import { formatNumberUserReadable } from "@/shared/utils/";
import { formatEther } from "viem";

export const CardPetitionInformation = ({
  isLoading,
  data,
}: {
  isLoading: boolean;
  data?: PetitionResponse;
}) => {
  const originalSigners = data?.signers ?? [];

  // If signers length is less than 40, repeat until we have 40
  let supporters = originalSigners;
  if (originalSigners.length > 0 && originalSigners.length < 40) {
    supporters = [];
    while (supporters.length < 40) {
      const remainingSlots = 40 - supporters.length;
      const signersToAdd = originalSigners.slice(
        0,
        Math.min(remainingSlots, originalSigners.length),
      );
      supporters = [...supporters, ...signersToAdd];
    }
  }

  return (
    <Card className="border-light-dark sm:bg-surface-default mb-10 h-[156px] w-full border max-sm:border-0 sm:mb-0 sm:border">
      <div className="flex w-full flex-col sm:flex-row">
        <div className="border-light-dark flex w-full justify-between gap-2 border border-t border-l-0 p-4 max-sm:border-r-0 max-sm:border-b sm:w-1/2 sm:border-t-0 sm:border-r sm:border-b-0">
          <div className="flex items-center gap-2">
            <p className="text-md text-secondary">Total Supporters</p>
            <TooltipInfo text="The total number of supporters who have voted in the petition." />
          </div>

          {isLoading ? (
            <div className="size-4 animate-pulse rounded-sm bg-gray-300" />
          ) : (
            <p className="text-md text-secondary">
              {data?.totalSignatures ?? "-"}
            </p>
          )}
        </div>
        <div className="border-light-dark flex w-full justify-between gap-2 border border-t-0 border-r-0 border-b border-l-0 p-4 sm:w-1/2 sm:border-b-0">
          <div className="flex items-center gap-2">
            <p className="text-md text-secondary">Supporters Voting Power</p>
            <TooltipInfo text="The total voting power of all supporters who have voted in the petition." />
          </div>

          {isLoading ? (
            <div className="size-4 animate-pulse rounded-sm bg-gray-300" />
          ) : data?.totalSignaturesPower !== "0" ? (
            <p className="text-md text-primary">
              {formatNumberUserReadable(
                Number(formatEther(BigInt(data?.totalSignaturesPower ?? 0n))),
              )}
            </p>
          ) : (
            <p className="text-md text-primary">-</p>
          )}
        </div>
      </div>

      <SupportersCarroussel isLoading={isLoading} supporters={supporters} />
    </Card>
  );
};
