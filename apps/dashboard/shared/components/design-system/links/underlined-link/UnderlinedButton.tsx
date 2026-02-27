import { ButtonHTMLAttributes, ReactNode } from "react";

import { underlinedStyles } from "@/shared/components/design-system/links/underlined-link/UnderlinedLink";
import { cn } from "@/shared/utils";

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
