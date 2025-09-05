"use client";

import { cn } from "@/shared/utils/";
import { useRouter, useParams, usePathname } from "next/navigation";
import { ButtonHTMLAttributes } from "react";
import { ElementType } from "react";

interface ButtonHeaderSidebar extends ButtonHTMLAttributes<HTMLButtonElement> {
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
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const daoId = params?.daoId as string;
  const currentPage = pathname?.split("/").pop();

  // Special case: DAO Overview page has URL /{daoId}/ but page="/"
  const isDaoOverviewPage =
    pathname === `/${daoId}` || pathname === `/${daoId}/`;
  const isActive = page === "/" ? isDaoOverviewPage : currentPage === page;

  const handleNavigation = () => {
    if (daoId) {
      // Special case: DAO Overview page uses root path /{daoId}
      const targetPath = page === "/" ? `/${daoId}` : `/${daoId}/${page}`;
      router.push(targetPath);
    }
  };

  return (
    <button
      className={cn(
        "group flex w-full cursor-pointer items-center gap-3 rounded-md border border-transparent p-2 text-sm font-medium",
        {
          "cursor-default bg-white": isActive,
          "hover:border-light-dark hover:bg-surface-contrast": !isActive,
        },
        className,
      )}
      onClick={handleNavigation}
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
    </button>
  );
};
