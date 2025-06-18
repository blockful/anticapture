import { cn } from "@/shared/utils/";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ComponentProps, ReactNode } from "react";

type OutlinedBoxProps = ComponentProps<"div"> & {
  variant?: "success" | "warning" | "error" | "lightDark";
  customIcon?: ReactNode;
  hideIcon?: boolean;
  iconPosition?: "left" | "right";
  disabled?: boolean;
};

export const OutlinedBox = ({
  variant = "lightDark",
  iconPosition = "left",
  hideIcon = false,
  customIcon,
  children,
  disabled = false,
  ...props
}: OutlinedBoxProps) => {
  const variantClasses = {
    success:
      "border-success bg-success/12 text-success font-mono text-sm font-medium",
    warning:
      "border-warning bg-warning/12 text-warning font-mono text-sm font-medium",
    error: "border-error bg-error/12 text-error font-mono text-sm font-medium",
    lightDark:
      "border-foreground bg-surface-contrast text-secondary font-mono text-sm font-medium",
  };

  const disabledVariantClasses =
    "bg-surface-contrast text-secondary font-mono text-sm font-medium border-[#3F3F46]";

  const variantIcons = {
    success: <CheckCircle2 className="size-4" />,
    warning: <AlertCircle className="size-4" />,
    error: <AlertTriangle className="size-4" />,
    lightDark: "",
  };

  return (
    <div
      {...props}
      className={cn(
        "flex items-center gap-2 rounded-md border",
        props.className,
        variantClasses[variant],
        disabled && disabledVariantClasses,
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
