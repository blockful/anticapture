import { cn } from "@/shared/utils/utils";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ComponentProps, ReactNode } from "react";

type OutlinedBoxProps = ComponentProps<"div"> & {
  variant?: "success" | "warning" | "error" | "lightDark";
  customIcon?: ReactNode;
  hideIcon?: boolean;
  iconPosition?: "left" | "right";
};

export const OutlinedBox = ({
  variant = "lightDark",
  iconPosition = "left",
  hideIcon = false,
  customIcon,
  children,
  ...props
}: OutlinedBoxProps) => {
  const variantClasses = {
    success:
      "border-success bg-success bg-opacity-[12%] text-success font-mono text-sm font-medium",
    warning:
      "border-warning bg-warning bg-opacity-[12%] text-warning font-mono text-sm font-medium",
    error:
      "border-error bg-error bg-opacity-[12%] text-error font-mono text-sm font-medium",
    lightDark:
      "border-foreground bg-lightDark text-foreground font-mono text-sm font-medium",
  };

  const variantIcons = {
    success: <CheckCircle2 className="size-4" />,
    warning: <AlertTriangle className="size-4" />,
    error: <AlertCircle className="size-4" />,
    lightDark: "",
  };

  return (
    <div
      {...props}
      className={cn(
        "flex items-center gap-2 rounded-md border",
        props.className,
        variantClasses[variant],
        {
          "flex-row-reverse": iconPosition === "right",
        },
      )}
    >
      <>
        {!customIcon && variantIcons[variant]}
        {customIcon}
      </>
      {children}
    </div>
  );
};
