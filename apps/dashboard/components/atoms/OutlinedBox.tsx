import { cn } from "@/lib/client/utils";
import { AlertCircle } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import React from "react";

type OutlinedBoxProps = React.ComponentProps<"div"> & {
  variant?: "success" | "warning" | "error" | "lightDark";
  customIcon?: React.ReactNode;
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
      "border-success bg-success bg-opacity-[12%] text-success font-roboto text-sm font-medium",
    warning:
      "border-warning bg-warning bg-opacity-[12%] text-warning font-roboto text-sm font-medium",
    error:
      "border-error bg-error bg-opacity-[12%] text-error font-roboto text-sm font-medium",
    lightDark:
      "border-foreground bg-lightDark text-foreground font-roboto text-sm font-medium",
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
      )}
    >
      {iconPosition === "left" && !hideIcon && (
        <>
          {!customIcon && variantIcons[variant]}
          {customIcon}
        </>
      )}
      {children}
      {iconPosition === "right" && !hideIcon && (
        <>
          {customIcon}
          {!customIcon && variantIcons[variant]}
        </>
      )}
    </div>
  );
};
