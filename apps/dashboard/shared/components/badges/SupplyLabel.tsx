import { cn } from "@/shared/utils";

export type SupplyType = "CEX" | "DEX" | "Delegation" | "Lending" | "Others";

interface SupplyLabelProps {
  type: SupplyType;
  className?: string;
}

const supplyTypeConfig = {
  CEX: {
    text: "CEX",
    textClass: "text-warning",
    boxClass: "bg-warning",
  },
  DEX: {
    text: "DEX",
    textClass: "text-success",
    boxClass: "bg-success",
  },
  Delegation: {
    text: "Delegation",
    textClass: "text-blue-400",
    boxClass: "bg-blue-400",
  },
  Lending: {
    text: "Lending",
    textClass: "text-purple-400",
    boxClass: "bg-purple-400",
  },
  Others: {
    text: "Others",
    textClass: "text-secondary",
    boxClass: "bg-secondary",
  },
} as const;

export const SupplyLabel = ({ type, className }: SupplyLabelProps) => {
  const config = supplyTypeConfig[type];

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {/* Colored box - 8px size with 2px border radius */}
      <div className={cn("rounded-xs size-2", config.boxClass)} />
      {/* 10px gap + text */}
      <span className={cn("text-sm font-normal", config.textClass)}>
        {config.text}
      </span>
    </div>
  );
};
