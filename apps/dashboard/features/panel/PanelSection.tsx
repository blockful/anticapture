"use client";

import { PanelTable } from "@/features/panel/components";
import {
  SubSection,
  SubSectionsContainer,
} from "@/shared/components/design-system/section";
import { useState } from "react";
import { Tabs } from "@radix-ui/react-tabs";
import { TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/utils";

export const PanelSection = () => {
  const [currency, setCurrency] = useState<"usd" | "eth">("usd");

  return (
    <SubSectionsContainer>
      <SubSection
        subsectionTitle="Panel"
        subsectionDescription="Check governance security across DAOs, with details on attack vectors and capture risks."
        switcherComponent={
          <SwitcherCurrency currency={currency} setCurrency={setCurrency} />
        }
        dateRange=""
      >
        <PanelTable currency={currency} />
      </SubSection>
    </SubSectionsContainer>
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
  const currencies: ("usd" | "eth")[] = ["usd", "eth"];

  return (
    <Tabs defaultValue={currency} className="gap-1">
      <TabsList>
        {currencies.map((curr) => (
          <TabsTrigger
            key={curr}
            className={cn(
              "cursor-pointer text-sm font-medium",
              isSmall
                ? "min-w-[60px] px-1.5 py-0.5"
                : "min-w-[84px] px-3 py-1.5",
            )}
            value={curr}
            onClick={() => setCurrency(curr)}
          >
            {curr.toUpperCase()}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
