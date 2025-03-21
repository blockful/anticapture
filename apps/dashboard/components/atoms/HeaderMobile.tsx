"use client";

import { AnticaptureIcon, ConnectWallet } from "@/components/atoms";
import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";

const NavDao = () => {
  const options = [
    "Overview",
    "Attack Profitability",
    "Token Distribution",
    "Governance Activity",
    "Governance Implementation",
    "Risk Analysis",
  ];

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <Tabs defaultValue={"Overview"} className="w-fit min-w-full">
          <TabsList className="flex">
            {options.map((option) => (
              <TabsTrigger
                className="gap-2 whitespace-nowrap px-2 py-3 text-xs font-medium text-foreground"
                key={option}
                value={option}
              >
                {option}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export const HeaderMobile = () => {
  return (
    <div className="h-full w-full">
      <div className="px-4 py-3">
        <div className="flex justify-between">
          <div className="flex">
            <AnticaptureIcon />
          </div>
          <div className="flex">
            <ConnectWallet />
          </div>
        </div>
      </div>
      <div className="border-b border-t border-b-white/10 border-t-white/10">
        <NavDao />
      </div>
    </div>
  );
};
