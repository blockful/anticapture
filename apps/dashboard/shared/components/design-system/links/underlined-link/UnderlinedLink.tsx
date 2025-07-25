import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";

type UnderlinedLinkProps = LinkProps & {
  children: ReactNode;
  openInNewTab: boolean;
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
      className="group border-foreground text-secondary hover:text-primary flex items-center gap-1 border-b border-dashed font-mono text-sm text-[13px] leading-[18px] font-medium tracking-wide uppercase duration-300 hover:border-white"
      {...props}
    >
      {children}
    </Link>
  );
};
