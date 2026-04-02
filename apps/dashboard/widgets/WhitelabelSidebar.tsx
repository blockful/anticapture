"use client";

import {
  Building2,
  Landmark,
  Newspaper,
  Sparkles,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/shared/components";
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
    label: "Delegates",
    page: WHITELABEL_ROUTES.delegates,
    icon: UserCheck,
    enabled: (daoId: DaoIdEnum) => !!daoConfigByDaoId[daoId].dataTables,
  },
  {
    label: "Activity Feed",
    page: WHITELABEL_ROUTES.activityFeed,
    icon: Newspaper,
    enabled: (daoId: DaoIdEnum) => !!daoConfigByDaoId[daoId].activityFeed,
  },
  {
    label: "SPP Accountability",
    page: WHITELABEL_ROUTES.sppAccountability,
    icon: Building2,
    enabled: (daoId: DaoIdEnum) => daoId === "ENS",
  },
] as const;

export const WhitelabelSidebar = ({
  daoId,
  isCollapsed,
}: {
  daoId: DaoIdEnum;
  isCollapsed: boolean;
}) => {
  const pathname = usePathname();
  const daoConfig = daoConfigByDaoId[daoId];

  return (
    <aside
      className={cn(
        "border-border-default bg-surface-background hidden h-screen shrink-0 border-r lg:flex lg:flex-col",
        isCollapsed ? "w-[88px]" : "w-[320px]",
      )}
    >
      <div
        className={cn(
          "border-border-default flex h-16 items-center border-b px-5",
          isCollapsed ? "justify-center px-3" : "justify-start",
        )}
      >
        <div className="flex items-center gap-3">
          <DaoAvatarIcon
            daoId={daoId}
            className="size-10"
            isRounded
            showBackground={false}
          />
          {!isCollapsed && (
            <span className="text-primary text-[18px] font-semibold">
              {daoConfig.name}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between px-3 py-4">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, page, icon: Icon, enabled }) => {
            if (!enabled(daoId)) {
              return null;
            }

            const href = getDaoPagePath({
              daoId,
              pathname,
              page,
            });
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={page}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-surface-opacity-brand text-link"
                    : "text-secondary hover:bg-surface-contrast hover:text-primary",
                  isCollapsed && "justify-center px-3",
                )}
              >
                <Icon className="size-5 shrink-0" />
                {!isCollapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-4">
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
            <p className="text-dimmed text-center text-sm">
              Powered by{" "}
              <a
                href="https://anticapture.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link font-medium"
              >
                Anticapture
              </a>
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};
