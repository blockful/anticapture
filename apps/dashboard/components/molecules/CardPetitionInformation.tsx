import { TooltipInfo } from "../atoms";
import { Card } from "../ui/card";

export const CardPetitionInformation = () => {
  return (
    <Card className="h-[156px] w-full border-lightDark sm:bg-dark">
      <div className="flex w-full">
        <div className="border border-t-0 border-l-0 border-r-1 border-b-1 flex w-1/2 gap-2 border-lightDark p-4">
          <p className="text-md text-foreground">Total Supporters</p>
          <TooltipInfo text={""} />
        </div>
        <div className="border border-t-0 border-l-0 border-r-0 border-b-1 flex w-1/2 gap-2 border-lightDark p-4">
          <p className="text-md text-foreground">Supporters Voting Power</p>
          <TooltipInfo text={""} />
        </div>
      </div>
      <div>
        
      </div>
    </Card>
  );
};
