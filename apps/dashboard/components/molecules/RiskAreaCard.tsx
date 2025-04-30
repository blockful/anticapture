import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { RiskLevel } from "@/lib/enums/RiskLevel";
import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/client/utils";

export type RiskArea = {
  name: string;
  level?: RiskLevel;
};

interface RiskAreaCardProps {
  riskArea: RiskArea;
}

interface RiskAreaCardWrapperProps {
  title: string;
  risks: RiskArea[];
}

/**
 * Individual card component for a single risk area
 */
export const RiskAreaCard = ({ riskArea: risk }: RiskAreaCardProps) => {
  // Determine which boxes should be filled based on risk level
  const isBox2Filled =
    risk.level === RiskLevel.MEDIUM || risk.level === RiskLevel.HIGH;
  const isBox3Filled = risk.level === RiskLevel.HIGH;

  return (
    <div className="flex flex-1 items-center gap-1">
      <div
        className={cn(
          "flex h-full h-[42px] flex-1 items-center justify-between p-2",
          {
            "bg-lightDark": risk.level === undefined,
            "bg-success bg-opacity-[12%]": risk.level === RiskLevel.LOW,
            "bg-warning bg-opacity-[12%]": risk.level === RiskLevel.MEDIUM,
            "bg-error bg-opacity-[12%]": risk.level === RiskLevel.HIGH,
          },
        )}
      >
        <div className="max-w-[110px]">
          <span
            className={cn(
              "font-mono text-xs font-medium tracking-wider sm:text-xs",
              {
                "text-foreground": risk.level === undefined,
                "text-success": risk.level === RiskLevel.LOW,
                "text-warning": risk.level === RiskLevel.MEDIUM,
                "text-error": risk.level === RiskLevel.HIGH,
              },
            )}
            title={risk.name}
          >
            {risk.name}
          </span>
        </div>

        {risk.level === undefined ? (
          <div className="flex items-center justify-center font-mono text-xs">
            <CounterClockwiseClockIcon className="size-5 text-foreground" />
          </div>
        ) : risk.level === RiskLevel.LOW ? (
          <CheckCircle2 className="text-success" size={20} />
        ) : risk.level === RiskLevel.MEDIUM ? (
          <Info className="text-warning" size={20} />
        ) : (
          <AlertTriangle className="text-error" size={20} />
        )}
      </div>
      <div className="flex h-full h-[42px] items-center">
        <div className="flex h-full flex-col gap-1">
          <div
            className={cn("h-full w-1 lg:w-1.5", {
              "bg-success bg-opacity-[12%]": risk.level === RiskLevel.LOW && isBox3Filled,
              "bg-warning bg-opacity-[12%]": risk.level === RiskLevel.MEDIUM && isBox3Filled,
              "bg-error bg-opacity-[12%]": risk.level === RiskLevel.HIGH && isBox3Filled,
              "bg-lightDark": risk.level === undefined || !isBox3Filled,
            })}
          />
          <div
            className={cn("h-full w-1 lg:w-1.5", {
              "bg-success bg-opacity-[12%]": risk.level === RiskLevel.LOW && isBox2Filled,
              "bg-warning bg-opacity-[12%]": risk.level === RiskLevel.MEDIUM && isBox2Filled,
              "bg-error bg-opacity-[12%]": risk.level === RiskLevel.HIGH && isBox2Filled,
              "bg-lightDark": risk.level === undefined || !isBox2Filled,
            })}
          />
          <div
            className={cn("h-full w-1 lg:w-1.5", {
              "bg-success bg-opacity-[12%]": risk.level === RiskLevel.LOW,
              "bg-warning bg-opacity-[12%]": risk.level === RiskLevel.MEDIUM,
              "bg-error bg-opacity-[12%]": risk.level === RiskLevel.HIGH,
              "bg-lightDark": risk.level === undefined,
            })}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Wrapper component that organizes multiple RiskAreaCards into columns
 */
export const RiskAreaCardWrapper = ({
  title,
  risks,
}: RiskAreaCardWrapperProps) => {
  return (
    <div className="flex w-full flex-col">
      {/* Desktop title */}
      <h3 className="mb-3 hidden font-mono text-sm font-medium tracking-wider text-white sm:block">
        {title}
      </h3>

      {/* Desktop layout - two columns */}
      <div className="grid grid-cols-2 gap-1 sm:gap-2">
        {risks.map((risk: RiskArea, index: number) => (
          <RiskAreaCard key={`${risk.name}-${index}`} riskArea={risk} />
        ))}
      </div>
    </div>
  );
};
