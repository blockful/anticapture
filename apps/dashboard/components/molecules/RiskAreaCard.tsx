import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { RiskLevel } from "@/lib/enums/RiskLevel";
import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/client/utils";
import { ReactNode } from "react";

export type RiskArea = {
  name: string;
  content?: ReactNode;
  level?: RiskLevel;
};

interface RiskAreaCardProps {
  riskArea: RiskArea;
  isActive?: boolean;
  onClick?: () => void;
  variant?: "dao-overview" | "risk-analysis";
}

type GridColumns = `${string}grid-cols-${number}${string}`;

interface RiskAreaCardWrapperProps {
  title: string;
  risks: RiskArea[];
  activeRiskId?: string;
  onRiskClick?: (riskName: string) => void;
  gridColumns?: GridColumns;
  variant?: "dao-overview" | "risk-analysis";
  hideTitle?: boolean;
}

interface RiskAreaCardInternalProps {
  risk: RiskArea;
  isActive: boolean;
  onClick?: () => void;
  variant: "dao-overview" | "risk-analysis";
}

/**
 * Internal component for the risk area card content
 */
const RiskAreaCardInternal = ({
  risk,
  isActive,
  onClick,
  variant,
}: RiskAreaCardInternalProps) => {
  // Determine which boxes should be filled based on risk level
  const isBox2Filled =
    risk.level === RiskLevel.MEDIUM || risk.level === RiskLevel.HIGH;
  const isBox3Filled = risk.level === RiskLevel.HIGH;

  // Adjust styling based on variant
  const isRiskAnalysis = variant === "risk-analysis";

  return (
    <div
      className={cn("flex w-full flex-1 cursor-pointer items-center gap-1")}
      onClick={onClick}
    >
      <div
        className={cn(
          "flex h-full flex-1 items-center justify-between",
          isRiskAnalysis
            ? "h-[62px] px-1 py-2 sm:px-2"
            : "h-[42px] px-1 py-2 sm:px-2",
          {
            "bg-lightDark": risk.level === undefined,
            "bg-success": risk.level === RiskLevel.LOW,
            "bg-warning": risk.level === RiskLevel.MEDIUM,
            "bg-error": risk.level === RiskLevel.HIGH,
            "bg-opacity-[12%]": !isActive && risk.level !== undefined,
          },
        )}
      >
        <div
          className={cn(
            "flex items-center",
            isRiskAnalysis ? "" : "max-w-[110px]",
          )}
        >
          <span
            className={cn(
              "block font-mono text-xs font-medium sm:tracking-wider",
              {
                "text-foreground": risk.level === undefined,
                "text-success": risk.level === RiskLevel.LOW && !isActive,
                "text-warning": risk.level === RiskLevel.MEDIUM && !isActive,
                "text-error": risk.level === RiskLevel.HIGH && !isActive,
                "text-darkest": isActive && risk.level !== undefined,
              },
            )}
            title={risk.name}
          >
            {risk.content ? risk.content : risk.name}
          </span>
        </div>
        <div className="flex items-center justify-center w-fit">
          {risk.level === undefined ? (
            <div className="flex items-center justify-center font-mono text-xs">
              <CounterClockwiseClockIcon className="size-5 text-foreground" />
            </div>
          ) : risk.level === RiskLevel.LOW ? (
            <CheckCircle2
              className={cn(
                "size-5",
                isActive ? "text-darkest" : "text-success",
              )}
            />
          ) : risk.level === RiskLevel.MEDIUM ? (
            <Info
              className={cn(
                "size-5",
                isActive ? "text-darkest" : "text-warning",
              )}
            />
          ) : (
            <AlertTriangle
              className={cn("size-5", isActive ? "text-darkest" : "text-error")}
            />
          )}
        </div>
      </div>
      <div
        className={cn(
          "flex h-full items-center",
          isRiskAnalysis ? "h-[62px]" : "h-[42px]",
        )}
      >
        <div className="flex h-full flex-col gap-1">
          <div
            className={cn(
              isRiskAnalysis ? "h-full w-1.5" : "h-full w-1 lg:w-1.5",
              {
                "bg-success": risk.level === RiskLevel.LOW && isBox3Filled,
                "bg-warning": risk.level === RiskLevel.MEDIUM && isBox3Filled,
                "bg-error": risk.level === RiskLevel.HIGH && isBox3Filled,
                "bg-opacity-[12%]": !isActive && isBox3Filled,
                "bg-lightDark": risk.level === undefined || !isBox3Filled,
              },
            )}
          />
          <div
            className={cn(
              isRiskAnalysis ? "h-full w-1.5" : "h-full w-1 lg:w-1.5",
              {
                "bg-success": risk.level === RiskLevel.LOW && isBox2Filled,
                "bg-warning": risk.level === RiskLevel.MEDIUM && isBox2Filled,
                "bg-error": risk.level === RiskLevel.HIGH && isBox2Filled,
                "bg-opacity-[12%]": !isActive && isBox2Filled,
                "bg-lightDark": risk.level === undefined || !isBox2Filled,
              },
            )}
          />
          <div
            className={cn(
              isRiskAnalysis ? "h-full w-1.5" : "h-full w-1 lg:w-1.5",
              {
                "bg-success": risk.level === RiskLevel.LOW,
                "bg-warning": risk.level === RiskLevel.MEDIUM,
                "bg-error": risk.level === RiskLevel.HIGH,
                "bg-opacity-[12%]": !isActive && risk.level !== undefined,
                "bg-lightDark": risk.level === undefined,
              },
            )}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Individual card component for a single risk area
 */
export const RiskAreaCard = ({
  riskArea: risk,
  isActive = false,
  onClick,
  variant = "dao-overview",
}: RiskAreaCardProps) => {
  // For dao-overview variant, return the internal component directly
  if (variant === "dao-overview") {
    return (
      <RiskAreaCardInternal
        risk={risk}
        isActive={isActive}
        onClick={onClick}
        variant={variant}
      />
    );
  }

  // For risk-analysis variant, wrap the internal component with additional styling
  return (
    <div className="flex w-full">
      <div
        className={cn(
          "w-full p-1.5",
          isActive && "border border-lightDark bg-darkest sm:bg-dark",
        )}
      >
        <RiskAreaCardInternal
          risk={risk}
          isActive={isActive}
          onClick={onClick}
          variant={variant}
        />
      </div>
      {isActive && (
        <div className="flex h-full items-center justify-center">
          <div className="h-0 w-0 border-y-8 border-l-8 border-y-transparent border-l-middleDark" />
        </div>
      )}
    </div>
  );
};

/**
 * Wrapper component that organizes multiple RiskAreaCards into columns
 */
export const RiskAreaCardWrapper = ({
  title,
  risks,
  activeRiskId,
  onRiskClick,
  gridColumns = "grid-cols-2",
  variant = "dao-overview",
  hideTitle = false,
}: RiskAreaCardWrapperProps) => {
  return (
    <div className="flex w-full flex-col gap-1">
      {/* Desktop title */}
      {!hideTitle && (
        <h3 className="mb-3 hidden font-mono text-xs font-medium tracking-wider text-white sm:block sm:text-sm">
          {title}
        </h3>
      )}

      {/* Grid layout with configurable columns */}
      <div className={`grid ${gridColumns} gap-1 sm:gap-2`}>
        {risks.map((risk: RiskArea, index: number) => (
          <RiskAreaCard
            key={`${risk.name}-${index}`}
            riskArea={risk}
            isActive={activeRiskId === risk.name}
            onClick={() => onRiskClick?.(risk.name)}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
};
