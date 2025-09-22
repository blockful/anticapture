"use client";

import { cn } from "@/shared/utils/";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { AnchorHTMLAttributes } from "react";
import { ElementType } from "react";

interface ButtonHeaderSidebar extends AnchorHTMLAttributes<HTMLAnchorElement> {
  page: string;
  icon: ElementType;
  label: string;
  className?: string;
}

export const ButtonHeaderSidebar = ({
  page,
  icon: Icon,
  label,
  className,
  ...props
}: ButtonHeaderSidebar) => {
  const params = useParams();
  const pathname = usePathname();

  const daoId = params?.daoId as string;
  const currentPage = pathname?.split("/").pop();

  // Special case: DAO Overview page has URL /{daoId}/ but page="/"
  const isDaoOverviewPage =
    pathname === `/${daoId}` || pathname === `/${daoId}/`;
  const isActive = page === "/" ? isDaoOverviewPage : currentPage === page;

  // Generate the target path
  const targetPath = daoId
    ? page === "/"
      ? `/${daoId}`
      : `/${daoId}/${page}`
    : "#";

  return (
    <Link
      href={targetPath}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-3 rounded-md border border-transparent p-2 text-sm font-medium",
        {
          "cursor-default bg-white": isActive,
          "hover:border-light-dark hover:bg-surface-contrast": !isActive,
        },
        className,
      )}
      {...props}
    >
      <Icon
        className={cn("size-4", {
          "text-inverted": isActive,
          "text-secondary group-hover:text-primary": !isActive,
        })}
      />
      <p
        className={cn({
          "text-inverted": isActive,
          "text-secondary group-hover:text-primary": !isActive,
        })}
      >
        {label}
      </p>
    </Link>
  );
};
