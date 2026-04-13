"use client";

import {
  Bell,
  Briefcase,
  Landmark,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/shared/components";
import { WhitelabelConnectWallet } from "@/shared/components/wallet/WhitelabelConnectWallet";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";
import { getDaoPagePath, WHITELABEL_ROUTES } from "@/shared/utils/whitelabel";
import { WhitelabelHeader } from "@/widgets/WhitelabelHeader";
import { WhitelabelHeaderMobile } from "@/widgets/WhitelabelHeaderMobile";
import { WhitelabelSidebar } from "@/widgets/WhitelabelSidebar";

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

export const WhitelabelShell = ({
  daoId,
  children,
}: {
  daoId: DaoIdEnum;
  children: ReactNode;
}) => {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const daoConfig = daoConfigByDaoId[daoId];

  const navItems = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        href: getDaoPagePath({
          daoId,
          pathname,
          page: item.page,
        }),
      })).filter((item) => item.enabled(daoId)),
    [daoConfig, daoId, pathname],
  );

  return (
    <div className="bg-surface-background text-primary flex h-screen overflow-hidden">
      <WhitelabelSidebar
        daoId={daoId}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <WhitelabelHeader />

        <div className="lg:hidden">
          <WhitelabelHeaderMobile
            daoId={daoId}
            isMenuOpen={isMobileMenuOpen}
            onToggleMenu={() => setIsMobileMenuOpen((current) => !current)}
          />

          <div
            className={cn(
              "border-border-default bg-surface-background top-15.25 fixed inset-x-0 z-40 border-b px-4 py-4 transition-opacity duration-200",
              isMobileMenuOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            <div className="mb-4 sm:hidden">
              <WhitelabelConnectWallet className="w-full justify-center" />
            </div>

            <nav className="flex flex-col gap-2">
              {navItems.map(({ page, label, href, icon: Icon }) => {
                const isActive =
                  pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <Link
                    key={page}
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-surface-opacity-brand text-link"
                        : "text-secondary hover:bg-surface-contrast hover:text-primary",
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            <Button
              variant="outline"
              asChild
              className="mt-4 w-full justify-center"
            >
              <a
                href={
                  "https://forms.clickup.com/90132341641/f/2ky4wrw9-30353/Z1Y0VQ9TC6SQ3AMUMX"
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                Request feature
              </a>
            </Button>
          </div>
        </div>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
