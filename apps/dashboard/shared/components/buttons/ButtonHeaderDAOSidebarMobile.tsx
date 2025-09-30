"use client";

import { cn } from "@/shared/utils/";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";

export const ButtonHeaderDAOSidebarMobile = ({
  options,
}: {
  options: {
    page: string;
    title: string;
    enabled?: boolean;
  }[];
  headerOffset?: number;
}) => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const daoId = params?.daoId as string;
  const pathSegments = pathname?.split("/").filter(Boolean);

  // If pathname is /{daoId}, it's the overview page
  const isDaoOverviewPage =
    pathname === `/${daoId}` || pathname === `/${daoId}/`;
  const currentPage = isDaoOverviewPage ? "/" : pathSegments?.pop();

  const handleTabChange = (value: string) => {
    if (daoId) {
      // Handle DAO Overview special case
      if (value === "/") {
        router.push(`/${daoId}`);
      } else {
        router.push(`/${daoId}/${value}`);
      }
    }
  };

  return (
    <Tabs
      defaultValue="/"
      value={currentPage || "/"}
      onValueChange={handleTabChange}
      className="w-fit min-w-full"
    >
      <TabsList className="group flex border-b border-b-white/10 pl-4">
        {options.map(
          (option) =>
            option.enabled && (
              <TabsTrigger
                className={cn(
                  "text-secondary relative cursor-pointer gap-2 whitespace-nowrap px-2 py-3 text-xs font-medium",
                  "data-[state=active]:text-link",
                  "after:absolute after:-bottom-px after:left-0 after:right-0 after:h-px after:bg-transparent after:content-['']",
                  "data-[state=active]:after:bg-surface-solid-brand",
                )}
                key={option.page}
                value={option.page}
              >
                {option.title}
              </TabsTrigger>
            ),
        )}
      </TabsList>
    </Tabs>
  );
};
