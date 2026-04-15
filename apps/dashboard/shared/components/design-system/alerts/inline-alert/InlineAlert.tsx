import { AlertCircle, AlertTriangle, Info } from "lucide-react";

import { CardDescription } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";

import type { InlineAlertProps } from "@/shared/components/design-system/alerts/types";

const mapVariantToIcon = {
  info: {
    icon: <Info className="text-secondary size-4" />,
    color: "text-secondary",
    bgColor: "bg-surface-contrast",
  },
  warning: {
    icon: <AlertCircle className="text-warning size-4" />,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  error: {
    icon: <AlertTriangle className="text-error size-4" />,
    color: "text-error",
    bgColor: "bg-error/10",
  },
};

export const InlineAlert = ({
  text,
  variant = "info",
  className,
}: InlineAlertProps) => {
  return (
    <div className={cn("bg-surface-contrast w-full", className)}>
      <CardDescription
        className={cn(
          "flex w-full items-center gap-2 p-2",
          mapVariantToIcon[variant].bgColor,
        )}
      >
        <div className="mt-0.5 lg:mt-0">{mapVariantToIcon[variant].icon}</div>
        <p className="text-secondary text-sm font-normal">{text}</p>
      </CardDescription>
    </div>
  );
};
