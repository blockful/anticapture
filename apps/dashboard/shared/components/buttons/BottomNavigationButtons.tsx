"use client";

import { cn } from "@/shared/utils/";
import { usePathname } from "next/navigation";
import { Heart, BookOpen, HelpCircle, Mail } from "lucide-react";
import Link from "next/link";

interface BottomNavigationButtonsProps {
  className?: string;
  isCompact?: boolean;
}

export const BottomNavigationButtons = ({
  className,
}: BottomNavigationButtonsProps) => {
  const pathname = usePathname();

  const navigationItems = [
    {
      icon: Mail,
      label: "Contact",
      href: "/contact",
      isActive: pathname === "/contact",
    },
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
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "group flex w-full cursor-pointer items-center gap-3 rounded-md border border-transparent py-1.5 text-sm font-medium transition-colors",
              {
                "cursor-default bg-white": item.isActive,
                "hover:border-light-dark hover:bg-surface-contrast":
                  !item.isActive,
              },
              "flex-col gap-1 text-xs font-medium",
            )}
          >
            <Icon
              className={cn("size-4", {
                "text-inverted": item.isActive,
                "text-secondary group-hover:text-primary": !item.isActive,
              })}
            />
            <p className="text-secondary group-hover:text-primary font-inter text-xs font-medium transition-colors duration-300">
              {item.label}
            </p>
          </Link>
        );
      })}
    </div>
  );
};
