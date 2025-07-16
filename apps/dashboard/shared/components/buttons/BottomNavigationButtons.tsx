"use client";

import { useRouter, usePathname } from "next/navigation";
import { Heart, BookOpen, HelpCircle } from "lucide-react";
import { cn } from "@/shared/utils/";

interface BottomNavigationButtonsProps {
  className?: string;
  isCompact?: boolean;
}

export const BottomNavigationButtons = ({
  className,
  isCompact = false,
}: BottomNavigationButtonsProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    {
      icon: Heart,
      label: "Donate",
      href: "/donate",
      isActive: pathname === "/donate",
    },
    {
      icon: BookOpen,
      label: "Glossary",
      href: "/glossary",
      isActive: pathname === "/glossary",
    },
    {
      icon: HelpCircle,
      label: "FAQ",
      href: "/faq",
      isActive: pathname === "/faq",
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        className,
      )}
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.href}
            className={cn(
              "group flex w-full cursor-pointer items-center gap-3 rounded-md border border-transparent p-2 text-sm font-medium transition-colors",
              {
                "cursor-default bg-white": item.isActive,
                "hover:border-light-dark hover:bg-surface-contrast":
                  !item.isActive,
              },
              isCompact && "flex-col gap-1 text-xs font-medium",
            )}
            onClick={() => router.push(item.href)}
          >
            <Icon
              className={cn("size-4", {
                "text-inverted": item.isActive,
                "text-secondary group-hover:text-primary": !item.isActive,
              })}
            />
            {!isCompact && (
              <p
                className={cn("", {
                  "text-inverted": item.isActive,
                  "text-secondary group-hover:text-primary": !item.isActive,
                })}
              >
                {item.label}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
};
