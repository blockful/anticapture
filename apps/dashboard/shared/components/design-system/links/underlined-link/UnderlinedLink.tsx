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
      className="group flex items-center gap-1 border-b border-dashed border-foreground font-mono text-[13px] text-sm font-medium uppercase leading-[18px] tracking-wide text-foreground duration-300 hover:border-white hover:text-white"
      {...props}
    >
      {children}
    </Link>
  );
};
