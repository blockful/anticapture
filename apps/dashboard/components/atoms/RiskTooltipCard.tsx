import { RiskLevel } from "@/lib/enums/RiskLevel";
import { RiskLevelCardSmall } from "@/components/atoms";

interface RiskTooltipCardProps {
  title?: string;
  description?: string | string[];
  riskLevel?: RiskLevel;
}

/**
 * Card component that displays a risk area tooltip with title, risk level, and description
 */
export const RiskTooltipCard = ({
  title,
  description,
  riskLevel = RiskLevel.LOW,
}: RiskTooltipCardProps) => {
  // Process description to handle both string and array of strings
  const descriptionArray = Array.isArray(description)
    ? description
    : description
    ? [description]
    : [];

  return (
    <div className="flex flex-col">
      {/* Arrow pointing up to the card */}
      <div className="flex justify-center">
        <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-lightDark" />
      </div>
      
      {/* Tooltip content */}
      <div className="w-[376px] bg-darkest border border-lightDark rounded-md shadow-lg p-3 text-left">
        {/* Content */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium uppercase font-mono tracking-wider">{title}</h4>
          {riskLevel && <RiskLevelCardSmall status={riskLevel} />}
        </div>
        
        {/* Divider */}
        <div className="h-px bg-lightDark mb-3"></div>
        
        <div className="text-sm text-foreground">
          {descriptionArray.map((paragraph, index) => (
            <p
              key={index}
              className={index < descriptionArray.length - 1 && "mb-2" }
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}; 