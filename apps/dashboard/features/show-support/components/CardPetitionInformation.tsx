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
  data?: PetitionResponse;
}) => {
  const supporters = data?.signers ?? [];
  return (
    <Card className="border-light-dark sm:bg-surface-default mb-10 h-[156px] w-full border max-sm:border-0 sm:mb-0 sm:border">
      <div className="flex w-full flex-col sm:flex-row">
        <div className="border-light-dark flex w-full justify-between gap-2 border border-t border-l-0 p-4 max-sm:border-r-0 max-sm:border-b sm:w-1/2 sm:border-t-0 sm:border-r sm:border-b-0">
          <div className="flex items-center gap-2">
            <p className="text-md text-foreground">Total Supporters</p>
            <TooltipInfo text="The total number of supporters who have voted in the petition." />
          </div>
          <p className="text-md text-foreground">
            {data?.totalSignatures ?? "-"}
          </p>
        </div>
        <div className="border-light-dark flex w-full justify-between gap-2 border border-t-0 border-r-0 border-b border-l-0 p-4 sm:w-1/2 sm:border-b-0">
          <div className="flex items-center gap-2">
            <p className="text-md text-foreground">Supporters Voting Power</p>
            <TooltipInfo text="The total voting power of all supporters who have voted in the petition." />
          </div>
          <p className="text-md text-primary">
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
