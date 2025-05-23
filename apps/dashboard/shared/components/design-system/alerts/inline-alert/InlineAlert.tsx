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
    icon: <AlertTriangle className="size-4 text-warning" />,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  error: {
    icon: <AlertCircle className="size-4 text-error" />,
    color: "text-error",
    bgColor: "bg-error/10",
  },
};

const InlineAlert = ({ text, variant = "info" }: InlineAlertProps) => {
  return (
    <CardDescription
      className={cn(
        "flex w-full items-start gap-2 rounded-lg p-2 sm:items-center",
        mapVariantToIcon[variant].bgColor,
      )}
    >
      <div className="mt-0.5 sm:mt-0">{mapVariantToIcon[variant].icon}</div>
      <p className="text-sm font-normal text-foreground">{text}</p>
    </CardDescription>
  );
};

export default InlineAlert;
