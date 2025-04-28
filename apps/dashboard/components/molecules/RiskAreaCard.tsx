import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { RiskLevel } from "@/lib/enums/RiskLevel";

export type RiskArea = {
  name: string;
  level: RiskLevel;
};

interface RiskAreaCardProps {
  riskArea: RiskArea;
}

interface RiskAreaCardWrapperProps {
  title: string;
  risks: RiskArea[];
}

/**
 * Get icon component based on risk level
 */
const getStatusIcon = (level: RiskLevel) => {
  switch (level) {
    case RiskLevel.LOW:
      return <CheckCircle2 className="text-success" size={20} />;
    case RiskLevel.MEDIUM:
      return <Info className="text-warning" size={20} />;
    case RiskLevel.HIGH:
      return <AlertTriangle className="text-error" size={20} />;
  }
};

/**
 * Get text color class based on risk level
 */
const getStatusColor = (level: RiskLevel) => {
  switch (level) {
    case RiskLevel.LOW:
      return "text-success";
    case RiskLevel.MEDIUM:
      return "text-warning";
    case RiskLevel.HIGH:
      return "text-error";
  }
};

/**
 * Get background color class based on risk level
 */
const getBackgroundColor = (level: RiskLevel) => {
  switch (level) {
    case RiskLevel.LOW:
      return "bg-successDark";
    case RiskLevel.MEDIUM:
      return "bg-warningDark";
    case RiskLevel.HIGH:
      return "bg-errorDark";
  }
};

/**
 * Individual card component for a single risk area
 */
export const RiskAreaCard = ({ riskArea: risk }: RiskAreaCardProps) => {
  // Determine which boxes should be filled based on risk level
  const isBox2Filled =
    risk.level === RiskLevel.MEDIUM || risk.level === RiskLevel.HIGH;
  const isBox3Filled = risk.level === RiskLevel.HIGH;

  return (
    <div className="flex-1 flex items-center gap-1">
      <div
        className={`flex h-[52px] sm:h-[72px] flex-1 items-center justify-between px-2 sm:px-4 ${getBackgroundColor(risk.level)}`}
      >
        <span
          className={`font-mono text-xs sm:text-base font-medium tracking-wider ${getStatusColor(risk.level)}`}
          title={risk.name}
        >
          {risk.name}
        </span>
        {getStatusIcon(risk.level)}
      </div>
      <div className="flex h-[52px] sm:h-[72px] items-center">
        <div className="h-full flex flex-col gap-1">
          <div
            className={`h-full w-1 lg:w-1.5 ${isBox3Filled ? getBackgroundColor(risk.level) : "bg-lightDark"}`}
            aria-hidden="true"
          />
          <div
            className={`h-full w-1 lg:w-1.5 ${isBox2Filled ? getBackgroundColor(risk.level) : "bg-lightDark"}`}
            aria-hidden="true"
          />
          <div
            className={`h-full w-1 lg:w-1.5 ${getBackgroundColor(risk.level)}`}
            aria-hidden="true"
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
      <h3 className="mb-3 hidden sm:block font-mono text-xl font-medium tracking-wider text-white">
        {title}
      </h3>
      
      {/* Mobile layout - two columns */}
      <div className="grid grid-cols-2 gap-1 sm:hidden">
        {risks.map((risk: RiskArea, index: number) => (
          <RiskAreaCard key={`mobile-${risk.name}-${index}`} riskArea={risk} />
        ))}
      </div>
      
      {/* Desktop layout - two columns */}
      <div className="">
        {/* Left column cards */}
        <div className="hidden sm:grid sm:grid-cols-1 lg:grid-cols-2 gap-2">
          {risks.map((risk: RiskArea, index: number) => (
            <RiskAreaCard key={`left-${risk.name}-${index}`} riskArea={risk} />
          ))}
        </div>

      </div>
    </div>
  );
};
