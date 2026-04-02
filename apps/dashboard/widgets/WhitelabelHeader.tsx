"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useQueryState } from "nuqs";
import { usePathname } from "next/navigation";

import { IconButton } from "@/shared/components";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { WhitelabelConnectWallet } from "@/shared/components/wallet/WhitelabelConnectWallet";
import { getWhitelabelSearchPlaceholder } from "@/shared/utils/whitelabel";

export const WhitelabelHeader = ({
  isSidebarCollapsed,
  onToggleSidebar,
}: {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) => {
  const pathname = usePathname();
  const [search, setSearch] = useQueryState("search", {
    defaultValue: "",
    clearOnDefault: true,
  });
  const searchPlaceholder = getWhitelabelSearchPlaceholder(pathname);
  const showSearch = !!searchPlaceholder;

  return (
    <header className="border-border-default bg-surface-background sticky top-0 z-20 hidden h-16 items-center justify-between gap-6 border-b px-6 lg:flex">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <IconButton
          icon={isSidebarCollapsed ? ChevronsRight : ChevronsLeft}
          variant="outline"
          size="lg"
          onClick={onToggleSidebar}
          aria-label={
            isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
        />
        {showSearch ? (
          <div className="max-w-xl flex-1">
            <Input
              type="search"
              hasIcon
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        ) : null}
      </div>
      <WhitelabelConnectWallet />
    </header>
  );
};
