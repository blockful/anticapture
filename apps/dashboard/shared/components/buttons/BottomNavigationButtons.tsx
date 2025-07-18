"use client";

import { cn } from "@/shared/utils/";
import { usePathname } from "next/navigation";
import { Heart, BookOpen, HelpCircle } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/shared/components/ui/tooltip";

interface BottomNavigationButtonsProps {
  className?: string;
  isCompact?: boolean;
}

export const BottomNavigationButtons = ({
  className,
  isCompact = false,
}: BottomNavigationButtonsProps) => {
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
    <div className={cn("flex flex-col gap-2", className)}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={cn(
                  "group flex w-full cursor-pointer items-center gap-3 rounded-md border border-transparent py-1.5 text-sm font-medium transition-colors",
                  {
                    "cursor-default bg-white": item.isActive,
                    "hover:border-light-dark hover:bg-surface-contrast":
                      !item.isActive,
                  },
                  isCompact && "flex-col gap-1 text-xs font-medium",
                )}
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
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              align="center"
              sideOffset={8}
              className="border-light-dark bg-surface-default text-primary z-50 rounded-lg border p-2 text-sm shadow-sm"
            >
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};
