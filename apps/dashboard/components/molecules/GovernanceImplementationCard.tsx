import { RiskLevel } from "@/lib/enums";
import { cn } from "@/lib/client/utils";
import { Card } from "@/components/ui/card";

export const GovernanceImplementationCard = ({
  title,
  value,
  description,
  riskLevel,
  isOpen,
  onToggle,
}: {
  title: string;
  value: string;
  description: string;
  riskLevel: RiskLevel;
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
}) => {

  const riskStyles = {
    [RiskLevel.HIGH]: "bg-white/15 text-red-500 rounded-full",
    [RiskLevel.MEDIUM]: "bg-white/15 text-amber-500 rounded-full",
    [RiskLevel.LOW]: "bg-white/15 text-green-500 rounded-full",
  };

  return (
    <Card
      className={cn(
        "relative flex w-full flex-col rounded-t-lg border border-lightDark bg-dark px-4 py-5 shadow transition-all duration-200 hover:cursor-pointer md:w-[calc(50%-10px)] xl4k:max-w-full",
        isOpen
          ? "z-20 rounded-b-none bg-lightDark"
          : "rounded-b-lg hover:bg-lightDark",
      )}
      onClick={onToggle}
    >
      {/* Rest of the component remains the same */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-6 w-6 items-center justify-center">
            <span
              className={cn(
                "absolute mb-1 text-3xl font-thin text-foreground transition-all duration-300",
                isOpen ? "rotate-90 opacity-0" : "opacity-100",
              )}
            >
              +
            </span>
            <span
              className={cn(
                "absolute mb-1 text-3xl font-thin text-foreground transition-all duration-300",
                isOpen ? "opacity-100" : "rotate-90 opacity-0",
              )}
            >
              -
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-white">{title}</h3>
            <span className="text-xl font-thin text-foreground">•</span>
            <span className="text-foreground">{value}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-0.5",
              riskStyles[riskLevel],
            )}
          >
            {riskLevel}
            <span className="inline-flex">
              <span className={cn("text-xs")}>•</span>
              <span
                className={cn(
                  "text-xs",
                  riskLevel === RiskLevel.LOW && "text-foreground",
                )}
              >
                •
              </span>
              <span
                className={cn(
                  "text-xs",
                  (riskLevel === RiskLevel.LOW ||
                    riskLevel === RiskLevel.MEDIUM) && "text-foreground",
                )}
              >
                •
              </span>
            </span>
          </span>
        </div>
      </div>
      <div
        className={cn(
          "absolute z-20 rounded-b-lg border border-t-0 border-lightDark bg-lightDark px-4",
          "top-full -left-px w-[calc(100%+2px)] overflow-hidden",
          isOpen 
            ? "visible max-h-[1000px] transform-gpu transition-all duration-500 ease-in-out pb-5" 
            : "invisible max-h-0 transform-gpu transition-all duration-200 ease-in-out pb-0"
        )}
        onClick={(e) => e.stopPropagation()} // Prevent clicks on description from closing
      >
        <div className="pt-5">
          <p className="text-sm text-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
};
