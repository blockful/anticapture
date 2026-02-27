import Link from "next/link";
import { ReactNode } from "react";

import { cn } from "@/shared/utils";

interface ClickableCellProps {
  href?: string;
  children: ReactNode;
  className?: string;
}

export const ClickableCell = ({
  href,
  children,
  className,
}: ClickableCellProps) => {
  const baseClassName = cn(
    "flex w-full items-center transition-colors duration-200",
    href && "cursor-pointer hover:bg-surface-contrast",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={baseClassName}>
        {children}
      </Link>
    );
  }

  return <div className={baseClassName}>{children}</div>;
};
