import { CardDescription } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface InlineAlertProps {
  text: string;
  variant: "info" | "warning" | "error";
}

const mapVariantToIcon = {
  info: {
    icon: <Info className="size-4 text-white" />,
    color: "text-info",
    bgColor: "bg-lightDark",
  },
  warning: {
    icon: <AlertTriangle className="text-warning size-4" />,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  error: {
    icon: <AlertCircle className="text-error size-4" />,
    color: "text-error",
    bgColor: "bg-error/10",
  },
};

export const InlineAlert = ({ text, variant = "info" }: InlineAlertProps) => {
  return (
    <div className="w-full overflow-hidden rounded-md bg-[#18181B]">
      <CardDescription
        className={cn(
          "flex w-full items-center gap-2 rounded-lg p-2 sm:items-center",
          mapVariantToIcon[variant].bgColor,
        )}
      >
        <div className="mt-0.5 sm:mt-0">{mapVariantToIcon[variant].icon}</div>
        <p className="text-foreground text-sm font-normal">{text}</p>
      </CardDescription>
    </div>
  );
};
