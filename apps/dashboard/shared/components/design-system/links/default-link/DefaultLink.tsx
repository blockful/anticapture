import { cva, type VariantProps } from "class-variance-authority";
import type { LinkProps } from "next/link";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/shared/utils";

export const defaultLinkVariants = cva(
  "flex items-center gap-1 font-mono tracking-wider uppercase leading-none font-medium transition-colors duration-300",
  {
    variants: {
      variant: {
        default: "text-secondary hover:text-primary",
        highlight: "text-link hover:text-link/80",
      },
      size: {
        default: "text-[13px]",
        sm: "text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type DefaultLinkProps = LinkProps &
  VariantProps<typeof defaultLinkVariants> & {
    children?: ReactNode;
    openInNewTab: boolean;
    className?: string;
  };

export const DefaultLink = ({
  children,
  href,
  openInNewTab = true,
  variant,
  size,
  className,
  ...props
}: DefaultLinkProps) => {
  return (
    <Link
      href={href}
      target={openInNewTab ? "_blank" : "_self"}
      rel="noopener noreferrer"
      className={cn(defaultLinkVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Link>
  );
};
