"use client";

import { TooltipInfo } from "../atoms";
import { Card } from "../ui/card";
import { SupportersCarroussel } from "../atoms/SupportersCarroussel";
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
    <Card className="h-[156px] w-full border-lightDark sm:bg-dark">
      <div className="flex w-full">
        <div className="border-r-1 border-b-1 flex w-1/2 justify-between gap-2 border border-l-0 border-t-0 border-lightDark p-4">
          <div className="flex items-center gap-2">
            <p className="text-md text-foreground">Total Supporters</p>
            <TooltipInfo text={""} />
          </div>
          <p className="text-md text-foreground">
            {data?.totalSignatures ?? "-"}
          </p>
        </div>
        <div className="border-b-1 flex w-1/2 justify-between gap-2 border border-l-0 border-r-0 border-t-0 border-lightDark p-4">
          <div className="flex items-center gap-2">
            <p className="text-md text-foreground">Supporters Voting Power</p>
            <TooltipInfo text={""} />
          </div>
          <p className="text-md text-foreground">
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
