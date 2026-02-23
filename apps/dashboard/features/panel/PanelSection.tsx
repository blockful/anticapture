"use client";

import { Tabs } from "@radix-ui/react-tabs";
import { useState } from "react";

import {
  PanelTable,
  DelegatedSupplyHistory,
  DaoProtectionLevels,
  TreasuryMonitoring,
} from "@/features/panel/components";
import {
  SubSection,
  SubSectionsContainer,
} from "@/shared/components/design-system/section";
import { TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/utils";

export const PanelSection = () => {
  const [currency, setCurrency] = useState<"usd" | "eth">("usd");

  return (
    <div className="flex flex-col gap-8 p-4 pt-[70px] lg:gap-2 lg:pt-5">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        <DaoProtectionLevels />
        <TreasuryMonitoring />
        <DelegatedSupplyHistory />
      </div>

      <SubSectionsContainer>
        <SubSection
          subsectionTitle="Panel"
          subsectionDescription="Check governance security across DAOs, with details on attack vectors and capture risks."
          switcherComponent={
            <SwitcherCurrency currency={currency} setCurrency={setCurrency} />
          }
          dateRange=""
        >
          <div className="flex flex-col">
            <PanelTable currency={currency} />
          </div>
        </SubSection>
      </SubSectionsContainer>
    </div>
  );
};

interface SwitcherCurrencyProps {
  currency: "usd" | "eth";
  setCurrency: (currency: "usd" | "eth") => void;
  isSmall?: boolean;
}

const SwitcherCurrency = ({
  currency,
  setCurrency,
  isSmall = false,
}: SwitcherCurrencyProps) => {
  const currencies: ("usd" | "eth")[] = ["eth", "usd"];

  return (
    <Tabs
      defaultValue={currency}
      className="mt-4 w-full gap-1 lg:mt-0 lg:w-auto"
    >
      <TabsList>
        {currencies.map((currency) => (
          <TabsTrigger
            key={currency}
            className={cn(
              "w-full cursor-pointer px-2 text-sm font-medium lg:w-auto",
              isSmall
                ? "min-w-[60px] px-1.5 py-0.5"
                : "min-w-[84px] px-3 py-1.5",
            )}
            value={currency}
            onClick={() => setCurrency(currency)}
          >
            {currency === "usd" ? "USD" : "Token Amount"}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
