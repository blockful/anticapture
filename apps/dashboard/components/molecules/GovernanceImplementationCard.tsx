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
    [RiskLevel.HIGH]: "bg-white/10 text-red-400 rounded-full",
    [RiskLevel.MEDIUM]: "bg-white/10 text-amber-500 rounded-full",
    [RiskLevel.LOW]: "bg-white/10 text-green-500 rounded-full",
  };

  return (
    <Card
      className={cn(
        "relative flex w-full flex-col rounded-t-lg border border-lightDark bg-dark px-3 py-3 shadow transition-all duration-200 hover:cursor-pointer md:w-[calc(50%-10px)] xl4k:max-w-full",
        isOpen
          ? "z-20 rounded-b-none bg-lightDark border-middleDark"
          : "rounded-b-lg hover:bg-lightDark",
      )}
      onClick={onToggle}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2 min-w-0"> {/* Added min-w-0 to allow truncation */}
          <div className="relative flex h-6 w-6 shrink-0 items-center justify-center"> {/* Added shrink-0 */}
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
          <div className="flex md:flex-row flex-col md:items-center md:text-center text-left md:gap-2 gap-0 min-w-0"> {/* Added min-w-0 */}
            <h3 className="text-white truncate">{title}</h3>
            <span className="text-xl hidden md:inline font-thin text-foreground shrink-0">•</span>
            <span className="text-foreground truncate shrink-0">{value}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2 shrink-0"> {/* Added ml-2 and shrink-0 */}
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
          "absolute z-20 rounded-b-lg border border-t-0 border-middleDark bg-lightDark px-4",
          "top-full -left-px w-[calc(100%+2px)] overflow-hidden",
          isOpen 
            ? "visible max-h-[1000px] transform-gpu transition-all duration-500 ease-in-out pb-5" 
            : "invisible max-h-0 transform-gpu transition-all duration-200 ease-in-out pb-0"
        )}
        onClick={(e) => e.stopPropagation()} // Prevent clicks on description from closing
      >
        <div className="pt-1">
          <p className="text-sm text-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
};
