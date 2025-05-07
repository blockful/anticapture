"use client";

import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { RiskLevel } from "@/lib/enums/RiskLevel";
import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/client/utils";
import { ReactNode, useState } from "react";
import { RiskTooltipCard } from "@/components/atoms";
import { RISK_AREAS } from "@/lib/constants/risk-areas";
import { RiskAreaEnum } from "@/lib/enums";

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
  riskAreas: RiskArea[];
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

  const riskLevelIcons = {
    [RiskLevel.LOW]: (
      <CheckCircle2
        className={cn(
          "size-4 sm:size-5",
          isActive ? "text-darkest" : "text-success",
        )}
      />
    ),
    [RiskLevel.MEDIUM]: (
      <AlertCircle
        className={cn(
          "size-4 sm:size-5",
          isActive ? "text-darkest" : "text-warning",
        )}
      />
    ),
    [RiskLevel.HIGH]: (
      <AlertTriangle
        className={cn(
          "size-4 sm:size-5",
          isActive ? "text-darkest" : "text-error",
        )}
      />
    ),
  };

  return (
    <div
      className={cn(
        "flex h-full w-full flex-1 cursor-pointer items-center gap-1",
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "flex h-full flex-1 items-center justify-between px-1 py-2 sm:px-2",
          {
            "bg-lightDark": risk.level === undefined,
            "bg-success shadow-success/30": risk.level === RiskLevel.LOW,
            "bg-warning shadow-warning/30": risk.level === RiskLevel.MEDIUM,
            "bg-error shadow-error/30": risk.level === RiskLevel.HIGH,
            "shadow-[0_0_20px_0]": isActive,
            "bg-opacity-[12%]": !isActive && risk.level !== undefined,
          },
        )}
      >
        <div className="flex items-center">
          <span
            className={cn("block font-mono font-medium sm:tracking-wider", {
              "!text-foreground": risk.level === undefined,
              "!text-success": risk.level === RiskLevel.LOW && !isActive,
              "!text-warning": risk.level === RiskLevel.MEDIUM && !isActive,
              "!text-error": risk.level === RiskLevel.HIGH && !isActive,
              "text-darkest": isActive && risk.level !== undefined,
              "text-alternative-sm": isRiskAnalysis,
              "text-xs": !isRiskAnalysis,
            })}
            title={risk.name}
          >
            {risk.content ? risk.content : risk.name}
          </span>
        </div>
        <div className="flex w-fit items-center justify-center">
          {risk.level ? (
            riskLevelIcons[risk.level as RiskLevel]
          ) : (
            <div className="flex items-center justify-center font-mono text-xs">
              <CounterClockwiseClockIcon className="size-4 text-foreground sm:size-5" />
            </div>
          )}
        </div>
      </div>
      <div className={cn("flex h-full items-center")}>
        <div className="flex h-full flex-col gap-1">
          <div
            className={cn("h-full w-1", {
              "bg-success": risk.level === RiskLevel.LOW && isBox3Filled,
              "bg-warning": risk.level === RiskLevel.MEDIUM && isBox3Filled,
              "bg-error": risk.level === RiskLevel.HIGH && isBox3Filled,
              "bg-opacity-[12%]": !isActive && isBox3Filled,
              "bg-lightDark": risk.level === undefined || !isBox3Filled,
            })}
          />
          <div
            className={cn("h-full w-1", {
              "bg-success": risk.level === RiskLevel.LOW && isBox2Filled,
              "bg-warning": risk.level === RiskLevel.MEDIUM && isBox2Filled,
              "bg-error": risk.level === RiskLevel.HIGH && isBox2Filled,
              "bg-opacity-[12%]": !isActive && isBox2Filled,
              "bg-lightDark": risk.level === undefined || !isBox2Filled,
            })}
          />
          <div
            className={cn("h-full w-1", {
              "bg-success": risk.level === RiskLevel.LOW,
              "bg-warning": risk.level === RiskLevel.MEDIUM,
              "bg-error": risk.level === RiskLevel.HIGH,
              "bg-opacity-[12%]": !isActive && risk.level !== undefined,
              "bg-lightDark": risk.level === undefined,
            })}
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
  riskArea,
  isActive = false,
  onClick,
  variant = "dao-overview",
}: RiskAreaCardProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const riskName = riskArea.name;
  const riskInfo = RISK_AREAS[riskName as RiskAreaEnum] || {
    title: riskName,
    description: "Risk description not available.",
  };

  // For dao-overview variant, return the internal component with optional tooltip
  if (variant === "dao-overview") {
    return (
      <div
        className="relative h-[42px]"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <RiskAreaCardInternal
          risk={riskArea}
          isActive={isActive}
          onClick={onClick}
          variant={variant}
        />

        {showTooltip && (
          <div className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 transform">
            <RiskTooltipCard
              title={riskInfo.title}
              description={riskInfo.description}
              riskLevel={riskArea.level}
            />
          </div>
        )}
      </div>
    );
  }

  // For risk-analysis variant, wrap the internal component with additional styling
  return (
    <div className="flex h-[62px] w-full">
      <div
        className={cn(
          "w-full p-1.5",
          isActive && "border-[2px] border-middleDark bg-darkest sm:bg-dark",
        )}
      >
        <RiskAreaCardInternal
          risk={riskArea}
          isActive={isActive}
          onClick={onClick}
          variant={variant}
        />
      </div>
      <div className="hidden h-full w-[13px] items-center justify-center sm:flex">
        {isActive && (
          <div className="size-0 border-y-[13px] border-l-[13px] border-y-transparent border-l-middleDark" />
        )}
      </div>
    </div>
  );
};

/**
 * Wrapper component that organizes multiple RiskAreaCards into columns
 */
export const RiskAreaCardWrapper = ({
  title,
  riskAreas,
  activeRiskId,
  onRiskClick,
  gridColumns = "grid-cols-2",
  variant = "dao-overview",
  hideTitle = false,
  withTooltip = true,
}: RiskAreaCardWrapperProps & { withTooltip?: boolean }) => {
  return (
    <div className="flex w-full flex-col gap-1">
      {/* Desktop title */}
      {!hideTitle && (
        <h3 className="mb-3 hidden font-mono text-xs font-medium tracking-wider text-white sm:block">
          {title}
        </h3>
      )}

      {/* Grid layout with configurable columns */}
      <div className={`grid ${gridColumns} gap-1`}>
        {riskAreas.map((risk: RiskArea, index: number) => (
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
