import { AlertCircle, AlertTriangle, Info } from "lucide-react";

import { CardDescription } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";

import type { InlineAlertProps } from "@/shared/components/design-system/alerts/types";

const mapVariant = {
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
    <div
      className={cn(
        "rounded-base w-full",
        mapVariant[variant].bgColor,
        className,
      )}
    >
      <CardDescription className="rounded-base flex w-full items-center gap-2 p-2">
        <div className="mt-0.5 lg:mt-0">{mapVariant[variant].icon}</div>
        <p className={cn("text-sm font-normal", mapVariant[variant].color)}>
          {text}
        </p>
      </CardDescription>
    </div>
  );
};
