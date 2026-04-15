"use client";

import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";

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

  const [inputValue, setInputValue] = useState(search);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync local input when the URL search param changes externally (e.g. browser back/forward)
  useEffect(() => {
    setInputValue(search);
  }, [search]);

  const onProposalDetail = isProposalDetailPath(pathname);
  const searchPlaceholder = getWhitelabelSearchPlaceholder(pathname);
  const showSearch = !!searchPlaceholder;

  if (onProposalDetail) return null;

  return (
    <header className="border-border-default bg-surface-background sticky top-0 z-10 hidden h-[65px] items-center justify-between gap-6 border-b px-6 lg:flex">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {showSearch && (
          <div className="max-w-xl flex-1">
            <Input
              type="search"
              hasIcon
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={inputValue}
              onChange={(event) => {
                const value = event.target.value;
                setInputValue(value);
                clearTimeout(debounceTimer.current);
                if (value === "") {
                  setSearch("");
                } else {
                  debounceTimer.current = setTimeout(
                    () => setSearch(value),
                    500,
                  );
                }
              }}
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
