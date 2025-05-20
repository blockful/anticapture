import { cn } from "@/shared/utils";
import Link, { LinkProps } from "next/link";

type DefaultLinkProps = LinkProps & {
  children?: React.ReactNode;
  openInNewTab: boolean;
  variant?: "default" | "highlight";
};

const defaultClasses =
  "flex h-full items-center gap-1 font-mono tracking-wider uppercase leading-none text-[13px] font-medium transition-colors duration-300";

const variantClasses = {
  default: "text-foreground hover:text-white",
  highlight: "text-tangerine hover:text-tangerine/80",
};

export const DefaultLink = ({
  children,
  href,
  openInNewTab = true,
  variant = "default",
  ...props
}: DefaultLinkProps) => {
  return (
    <Link
      href={href}
      target={openInNewTab ? "_blank" : "_self"}
      rel="noopener noreferrer"
      className={cn(defaultClasses, variantClasses[variant])}
      {...props}
    >
      {children}
    </Link>
  );
};
