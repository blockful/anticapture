import { cn } from "@/shared/utils";
import Link, { LinkProps } from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { ReactNode } from "react";

const defaultLinkVariants = cva(
  "flex items-center gap-1 font-mono tracking-wider uppercase leading-none text-[13px] font-medium transition-colors duration-300",
  {
    variants: {
      variant: {
        default: "text-secondary hover:text-primary",
        highlight: "text-link hover:text-link/80",
      },
    },
    defaultVariants: {
      variant: "default",
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
  className,
  ...props
}: DefaultLinkProps) => {
  return (
    <Link
      href={href}
      target={openInNewTab ? "_blank" : "_self"}
      rel="noopener noreferrer"
      className={cn(defaultLinkVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Link>
  );
};
