import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";

export const underlinedStyles =
  "group border-foreground text-secondary hover:text-primary flex items-center gap-1 border-b border-dashed font-mono text-sm text-[13px] leading-[18px] font-medium tracking-wide uppercase duration-300 hover:border-white";

type UnderlinedLinkProps = LinkProps & {
  children: ReactNode;
  openInNewTab: boolean;
  className?: string;
};

export const UnderlinedLink = ({
  children,
  href,
  openInNewTab,
  ...props
}: UnderlinedLinkProps) => {
  return (
    <Link
      href={href}
      target={openInNewTab ? "_blank" : "_self"}
      rel="noopener noreferrer"
      className="border-foreground text-secondary hover:text-primary group flex items-center gap-1 border-b border-dashed font-mono text-[13px] text-sm font-medium uppercase leading-[18px] tracking-wide duration-300 hover:border-white"
      {...props}
    >
      {children}
    </Link>
  );
};
