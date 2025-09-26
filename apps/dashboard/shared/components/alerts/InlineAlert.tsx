import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/shared/utils";

type InlineAlertProps = {
  variant: "info" | "warning" | "error";
  label: string;
};

export const InlineAlert = ({ variant, label }: InlineAlertProps) => {
  const mapVariantToBackgroundColor = {
    info: "bg-surface-contrast",
    warning: "bg-warning/10",
    error: "bg-error/10",
  };
  const mapVariantToIcon = {
    info: <Info className="text-primary size-4 w-fit" />,
    warning: <AlertCircle className="text-warning size-4" />,
    error: <AlertTriangle className="text-error size-4" />,
  };

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 rounded-md p-2",
        mapVariantToBackgroundColor[variant],
      )}
    >
      {mapVariantToIcon[variant]}
      <p className="text-secondary text-sm font-normal">{label}</p>
    </div>
  );
};
