import { useEffect, useRef, useState } from "react";
import { RiskLevel } from "@/lib/enums";
import { cn } from "@/lib/client/utils";
import { Card } from "../ui/card";

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
  const [cardWidth, setCardWidth] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Update width measurement when card is opened/closed
  useEffect(() => {
    if (cardRef.current) {
      setCardWidth(cardRef.current.offsetWidth);
    }

    // Also add resize listener
    const handleResize = () => {
      if (cardRef.current) {
        setCardWidth(cardRef.current.offsetWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  const riskStyles = {
    [RiskLevel.HIGH]: "bg-white/15 text-red-500 rounded-full",
    [RiskLevel.MEDIUM]: "bg-white/15 text-amber-500 rounded-full",
    [RiskLevel.LOW]: "bg-white/15 text-green-500 rounded-full",
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        "relative flex w-full flex-col rounded-t-lg border border-lightDark bg-dark px-4 py-5 shadow transition-all duration-200 hover:cursor-pointer sm:w-[calc(50%-10px)] xl4k:max-w-full",
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
                "absolute text-3xl mb-1 font-thin text-foreground transition-all duration-300",
                isOpen ? "rotate-90 opacity-0" : "opacity-100",
              )}
            >
              +
            </span>
            <span
              className={cn(
                "absolute text-3xl mb-1 font-thin text-foreground transition-all duration-300",
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
                  riskLevel === RiskLevel.LOW ? "text-foreground" : "",
                )}
              >
                •
              </span>
              <span
                className={cn(
                  "text-xs",
                  riskLevel === RiskLevel.LOW || riskLevel === RiskLevel.MEDIUM
                    ? "text-foreground"
                    : "",
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
          "absolute z-20 rounded-b-lg border border-t-0 border-lightDark bg-lightDark px-4 pb-5 transition-transform duration-200 ease-in-out",
          isOpen ? "visible opacity-100" : "invisible h-0 opacity-0",
        )}
        style={{
          top: "100%",
          left: "-1px", // Adjust for border
          width: cardWidth ? `${cardWidth}px` : "100%",
        }}
        onClick={(e) => e.stopPropagation()} // Prevent clicks on description from closing
      >
        <p className="text-sm text-foreground">{description}</p>
      </div>
    </Card>
  );
};
