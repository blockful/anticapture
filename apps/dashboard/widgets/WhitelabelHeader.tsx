"use client";

import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";

import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { WhitelabelConnectWallet } from "@/shared/components/wallet/WhitelabelConnectWallet";
import { getWhitelabelSearchPlaceholder } from "@/shared/utils/whitelabel";

const isProposalDetailPath = (pathname: string) =>
  /\/proposals\/[^/]+/.test(pathname);

export const WhitelabelHeader = () => {
  const pathname = usePathname();
  const [search, setSearch] = useQueryState("search", {
    defaultValue: "",
    clearOnDefault: true,
  });

  const onProposalDetail = isProposalDetailPath(pathname);
  const searchPlaceholder = getWhitelabelSearchPlaceholder(pathname);
  const showSearch = !!searchPlaceholder;

  if (onProposalDetail) return null;

  return (
    <header className="border-border-default bg-surface-background sticky top-0 z-10 hidden h-[60px] items-center justify-between gap-6 border-b px-6 lg:flex">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {showSearch && (
          <div className="max-w-xl flex-1">
            <Input
              type="search"
              hasIcon
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="border-transparent bg-transparent"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <WhitelabelConnectWallet />
      </div>
    </header>
  );
};
