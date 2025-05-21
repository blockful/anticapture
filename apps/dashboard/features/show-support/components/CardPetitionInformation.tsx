"use client";

import { TooltipInfo } from "@/shared/components";
import { Card } from "@/shared/components/ui/card";
import { SupportersCarroussel } from "@/shared/components/carroussels/SupportersCarroussel";
import { PetitionResponse } from "@/features/show-support/hooks";
import { formatNumberUserReadable } from "@/shared/utils/";
import { formatEther } from "viem";

export const CardPetitionInformation = ({
  data,
}: {
  data: PetitionResponse | null;
}) => {
  const supporters =
    data?.petitionSignatures.map((signature) => signature.accountId) ?? [];
  return (
    <Card className="sm:border mb-10 h-[156px] w-full border border-light-dark max-sm:border-0 sm:mb-0 sm:bg-dark">
      <div className="flex w-full flex-col sm:flex-row">
        <div className="sm:border-r max-sm:border-b border-t flex w-full justify-between gap-2 border border-l-0 border-light-dark p-4 max-sm:border-r-0 sm:w-1/2 sm:border-b-0 sm:border-t-0">
          <div className="flex items-center gap-2">
            <p className="text-md text-foreground">Total Supporters</p>
            <TooltipInfo />
          </div>
          <p className="text-md text-foreground">
            {data?.totalSignatures ?? "-"}
          </p>
        </div>
        <div className="border-b flex w-full justify-between gap-2 border border-l-0 border-r-0 border-t-0 border-light-dark p-4 sm:w-1/2 sm:border-b-0">
          <div className="flex items-center gap-2">
            <p className="text-md text-foreground">Supporters Voting Power</p>
            <TooltipInfo />
          </div>
          <p className="text-md text-white">
            {data?.totalSignaturesPower !== "0"
              ? formatNumberUserReadable(
                  Number(formatEther(BigInt(data?.totalSignaturesPower ?? 0n))),
                )
              : "-"}
          </p>
        </div>
      </div>
      {supporters.length > 0 && (
        <SupportersCarroussel supporters={supporters} />
      )}
    </Card>
  );
};
