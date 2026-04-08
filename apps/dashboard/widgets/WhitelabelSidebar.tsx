"use client";

import {
  Bell,
  Briefcase,
  ChevronsLeft,
  ChevronsRight,
  Landmark,
  Newspaper,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { DaoAvatarIcon } from "@/shared/components/icons";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";
import { getDaoPagePath, WHITELABEL_ROUTES } from "@/shared/utils/whitelabel";

const NAV_ITEMS = [
  {
    label: "Proposals",
    page: WHITELABEL_ROUTES.proposals,
    icon: Landmark,
    enabled: (daoId: DaoIdEnum) => !!daoConfigByDaoId[daoId].governancePage,
  },
  {
    label: "Holders & Delegates",
    page: WHITELABEL_ROUTES.holdersAndDelegates,
    icon: Users,
    enabled: (daoId: DaoIdEnum) => !!daoConfigByDaoId[daoId].dataTables,
  },
  {
    label: "Activity Feed",
    page: WHITELABEL_ROUTES.activityFeed,
    icon: Newspaper,
    enabled: (daoId: DaoIdEnum) => !!daoConfigByDaoId[daoId].activityFeed,
  },
  {
    label: "Service Providers",
    page: WHITELABEL_ROUTES.serviceProviders,
    icon: Briefcase,
    enabled: (daoId: DaoIdEnum) => !!daoConfigByDaoId[daoId].serviceProviders,
  },
  {
    label: "Notifications",
    page: WHITELABEL_ROUTES.notifications,
    icon: Bell,
    enabled: () => true,
  },
  {
    label: "Governance Settings",
    page: WHITELABEL_ROUTES.governanceSettings,
    icon: Settings,
    enabled: () => true,
  },
] as const;

type NavItemProps = {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive: boolean;
  isCollapsed: boolean;
};

const NavItem = ({
  icon: Icon,
  label,
  href,
  isActive,
  isCollapsed,
}: NavItemProps) => (
  <Link
    href={href}
    className={cn(
      "group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
      "h-[33px]",
      isActive
        ? "bg-surface-opacity-brand text-link"
        : "bg-surface-background text-secondary hover:bg-surface-opacity-brand hover:text-primary",
      isCollapsed && "justify-center",
    )}
  >
    <Icon
      className={cn(
        "size-4 shrink-0 transition-colors",
        isActive ? "text-link" : "text-secondary group-hover:text-primary",
      )}
    />
    {!isCollapsed && (
      <span
        className={cn(
          "flex-1 truncate text-left text-[14px] font-medium leading-5 transition-colors",
          isActive ? "text-link" : "text-secondary group-hover:text-primary",
        )}
      >
        {label}
      </span>
    )}
  </Link>
);

export const WhitelabelSidebar = ({
  daoId,
  isCollapsed,
  onToggleCollapse,
}: {
  daoId: DaoIdEnum;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) => {
  const pathname = usePathname();
  const daoConfig = daoConfigByDaoId[daoId];

  const renderNavItems = (
    items: ReadonlyArray<{
      label: string;
      page: string;
      icon: React.ElementType;
      enabled: (daoId: DaoIdEnum) => boolean;
    }>,
  ) =>
    items
      .filter((item) => item.enabled(daoId))
      .map(({ label, page, icon }) => {
        const href = getDaoPagePath({ daoId, pathname, page });
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <NavItem
            key={page}
            icon={icon}
            label={label}
            href={href}
            isActive={isActive}
            isCollapsed={isCollapsed}
          />
        );
      });

  return (
    <aside
      className={cn(
        "bg-surface-background border-border-default sticky top-0 z-20 hidden h-screen shrink-0 flex-col overflow-visible border-r transition-all duration-300 lg:flex",
        isCollapsed ? "w-[68px]" : "w-[224px]",
      )}
    >
      {/* Header */}
      <div className="border-border-default relative flex h-[60px] shrink-0 items-center border-b px-2.5 py-2">
        <div
          className={cn(
            "flex flex-1 items-center gap-2 p-1",
            isCollapsed && "justify-center",
          )}
        >
          {daoConfig.whitelabel?.branding?.logo ? (
            <daoConfig.whitelabel.branding.logo className="size-8 shrink-0 rounded-full" />
          ) : (
            <DaoAvatarIcon
              daoId={daoId}
              className="size-8 shrink-0"
              isRounded
              showBackground={false}
            />
          )}
          {!isCollapsed && (
            <span className="text-primary text-[18px] font-medium leading-6">
              {daoConfig.name}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="bg-surface-background border-border-default hover:bg-surface-contrast absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 cursor-pointer rounded-lg border p-1.5 transition-colors"
        >
          {isCollapsed ? (
            <ChevronsRight className="text-primary size-3.5" />
          ) : (
            <ChevronsLeft className="text-primary size-3.5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {/* Nav items */}
        <div className="flex flex-col gap-3">{renderNavItems(NAV_ITEMS)}</div>

        {/* Footer - pushed to bottom */}
        <div className="mt-auto flex flex-col items-center gap-2.5">
          <Button variant="outline" asChild className="w-full justify-center">
            <a
              href={daoConfig.whitelabel?.requestFeatureUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Sparkles className="size-4" />
              {!isCollapsed && "Request feature"}
            </a>
          </Button>

          {!isCollapsed && (
            <p className="text-dimmed w-full text-center text-xs font-medium leading-4">
              Powered by <span className="text-[#0080bc]">Blockful</span>
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};
