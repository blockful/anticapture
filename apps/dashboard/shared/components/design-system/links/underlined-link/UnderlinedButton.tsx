import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/utils";
import { underlinedStyles } from "@/shared/components/design-system/links/underlined-link/UnderlinedLink";

type UnderlinedButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
};

export const UnderlinedButton = ({
  children,
  className,
  ...props
}: UnderlinedButtonProps) => {
  return (
    <button
      type="button"
      className={cn(underlinedStyles, "cursor-pointer", className)}
      {...props}
    >
      {children}
    </button>
  );
};
