import { TooltipInfo } from "../atoms";
import { Card } from "../ui/card";
import { SupportersCarroussel } from "../atoms/SupportersCarroussel";
import { useParams } from "next/navigation";
import { usePetitionSignatures } from "@/hooks/usePetition";
import { DaoIdEnum } from "@/lib/types/daos";

// Mock data for supporters
const mockSupporters = [
  { address: "0x1234", name: "zeugh.eth", icon: "" },
  { address: "0x2345", name: "zeugh.eth", icon: "" },
  { address: "0x3456", name: "zeugh.eth", icon: "" },
  { address: "0x4567", name: "zeugh.eth", icon: "" },
  { address: "0x5678", name: "zeugh.eth", icon: "" },
  { address: "0x6789", name: "zeugh.eth", icon: "" },
];

export const CardPetitionInformation = () => {
  const { daoId } = useParams();
  const { data } = usePetitionSignatures(daoId as DaoIdEnum, "0x");
  console.log(data);
  return (
    <Card className="h-[156px] w-full border-lightDark sm:bg-dark">
      <div className="flex w-full">
        <div className="border-r-1 border-b-1 flex w-1/2 gap-2 border border-l-0 border-t-0 border-lightDark p-4">
          <p className="text-md text-foreground">Total Supporters</p>
          <TooltipInfo text={""} />
        </div>
        <div className="border-b-1 flex w-1/2 gap-2 border border-l-0 border-r-0 border-t-0 border-lightDark p-4">
          <p className="text-md text-foreground">Supporters Voting Power</p>
          <TooltipInfo text={""} />
        </div>
      </div>
      <div>
        <SupportersCarroussel supporters={mockSupporters} />
      </div>
    </Card>
  );
};
