import { cn } from "@/shared/utils";
import Link, { LinkProps } from "next/link";

type UnderlinedLinkProps = LinkProps & {
  children: React.ReactNode;
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
      className={cn([
        "group flex items-center gap-1 border-b border-dashed border-foreground font-mono text-[13px] text-sm font-medium uppercase leading-[18px] tracking-wide text-foreground duration-300 hover:border-white hover:text-white",
      ])}
      {...props}
    >
      {children}
    </Link>
  );
};
