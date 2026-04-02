"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DaoAvatarIcon } from "@/shared/components/icons";
import { WhitelabelConnectWallet } from "@/shared/components/wallet/WhitelabelConnectWallet";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getDaoPagePath, WHITELABEL_ROUTES } from "@/shared/utils/whitelabel";

export const WhitelabelHeaderMobile = ({
  daoId,
  isMenuOpen,
  onToggleMenu,
}: {
  daoId: DaoIdEnum;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}) => {
  const daoConfig = daoConfigByDaoId[daoId];
  const pathname = usePathname();

  return (
    <div className="border-border-default bg-surface-background sticky top-0 z-30 border-b px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={getDaoPagePath({
            daoId,
            pathname,
            page: WHITELABEL_ROUTES.proposals,
          })}
          className="flex min-w-0 items-center gap-3"
        >
          <DaoAvatarIcon
            daoId={daoId}
            className="size-9"
            isRounded
            showBackground={false}
          />
          <span className="text-primary truncate text-base font-semibold">
            {daoConfig.name}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <WhitelabelConnectWallet className="max-w-[240px]" />
          </div>
          <button
            type="button"
            onClick={onToggleMenu}
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            className="text-primary rounded-lg border border-transparent p-2"
          >
            {isMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
