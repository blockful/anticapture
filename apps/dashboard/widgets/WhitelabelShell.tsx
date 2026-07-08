"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/shared/components";
import { WhitelabelConnectWallet } from "@/shared/components/wallet/WhitelabelConnectWallet";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";
import { getDaoPagePath } from "@/shared/utils/whitelabel";
import { WHITELABEL_NAV_ITEMS } from "@/shared/utils/whitelabelNav";
import { WhitelabelHeader } from "@/widgets/WhitelabelHeader";
import { WhitelabelHeaderMobile } from "@/widgets/WhitelabelHeaderMobile";
import { WhitelabelSidebar } from "@/widgets/WhitelabelSidebar";

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
      WHITELABEL_NAV_ITEMS.map((item) => ({
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
    <div className="bg-surface-background text-primary flex h-dvh overflow-hidden">
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
              "border-border-default bg-surface-background top-13 fixed inset-x-0 z-40 border-b px-4 py-4 transition-opacity duration-200",
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

            {daoConfig.whitelabel?.requestFeatureLink && (
              <Button
                variant="outline"
                asChild
                className="mt-4 w-full justify-center"
              >
                <a
                  href={daoConfig.whitelabel.requestFeatureLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-umami-event="feature_request_click"
                  data-umami-event-source="whitelabel_shell"
                  data-ph-event="feature_request_click"
                  data-ph-source="whitelabel_shell"
                >
                  Request feature
                </a>
              </Button>
            )}
          </div>
        </div>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
