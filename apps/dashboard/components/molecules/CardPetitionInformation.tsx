"use client";

import { TooltipInfo } from "@/components/atoms";
import { Card } from "@/components/ui/card";
import { SupportersCarroussel } from "@/components/atoms/SupportersCarroussel";
import { useParams } from "next/navigation";
import { usePetitionSignatures } from "@/hooks/usePetition";
import { DaoIdEnum } from "@/lib/types/daos";

export const CardPetitionInformation = () => {
  const { daoId } = useParams();
  const { data } = usePetitionSignatures(daoId as DaoIdEnum, "0x");
  const supporters =
    data?.petitionSignatures.map((signature) => ({
      address: signature.accountId,
      name: "",
      icon: "",
    })) ?? [];
  return (
    <Card className="sm:border-1 mb-10 h-[156px] w-full border border-lightDark max-sm:border-0 sm:mb-0 sm:bg-dark">
      <div className="flex w-full flex-col sm:flex-row">
        <div className="sm:border-r-1 max-sm:border-b-1 border-t-1 flex w-full justify-between gap-2 border border-l-0 border-lightDark p-4 max-sm:border-r-0 sm:w-1/2 sm:border-b-0 sm:border-t-0">
          <div className="flex items-center gap-2">
            <p className="text-md text-foreground">Total Supporters</p>
            <TooltipInfo />
          </div>
          <p className="text-md text-foreground">
            {data?.totalSignatures ?? "-"}
          </p>
        </div>
        <div className="border border-b-1 flex w-full justify-between gap-2 border-l-0 border-r-0 border-t-0 border-lightDark p-4 sm:w-1/2 sm:border-b-0">
          <div className="flex items-center gap-2">
            <p className="text-md text-foreground">Supporters Voting Power</p>
            <TooltipInfo />
          </div>
          <p className="text-md text-white">
            {data?.totalSignaturesPower !== "0"
              ? data?.totalSignaturesPower
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
