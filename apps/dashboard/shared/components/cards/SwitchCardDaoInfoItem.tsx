"use client";

import { cn } from "@/shared/utils/";
import { Badge } from "@/shared/components";
import { ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface SwitchItemProps {
  switched?: boolean;
  icon?: ReactNode;
  href?: string;
}

export const SwitchCardDaoInfoItem = ({
  switched,
  icon,
  href,
}: SwitchItemProps) => {
  if (href) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer">
        <CustomBadge switched={switched} icon={icon} href={href} />
      </Link>
    );
  }
  return <CustomBadge switched={switched} icon={icon} href={href} />;
};

interface CustomBadgeProps {
  switched?: boolean;
  icon?: ReactNode;
  href?: string;
}

const CustomBadge = ({ switched, icon, href }: CustomBadgeProps) => {
  return (
    <Badge
      className={cn(
        "!bg-surface-contrast/20 sm:bg-surface-contrast! gap-1.5! px-2.5! py-1! flex h-full w-full lg:w-fit",
        {
          "hover:bg-middle-dark! cursor-pointer! transition-all duration-300":
            href,
        },
      )}
    >
      {switched ? (
        <CheckCircle2 className="text-success size-3.5" />
      ) : (
        <XCircle className="text-error size-3.5" />
      )}
      <p
        className={cn([
          "text-sm font-medium leading-tight",
          switched ? "text-success" : "text-error",
        ])}
      >
        {switched ? "Yes" : "No"}
      </p>
      <span> {icon}</span>
    </Badge>
  );
};
