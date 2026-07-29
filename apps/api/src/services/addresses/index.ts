import { Address } from "viem";

import { NonCirculatingAddresses, TreasuryAddresses } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { AddressLabelItem, AddressLabelsResponse } from "@/mappers";

// Any label mentioning vesting ("Vesting Address", "treasuryVester") is a
// vesting address; everything else counts as treasury.
const categorize = (label: string): AddressLabelItem["category"] =>
  label.toLowerCase().includes("vest") ? "vesting" : "treasury";

export class AddressLabelsService {
  constructor(private readonly daoId: DaoIdEnum) {}

  getAddressLabels(): AddressLabelsResponse {
    const labeled = new Map<string, AddressLabelItem>();

    const collect = (entries: Record<string, Address>) => {
      for (const [label, address] of Object.entries(entries)) {
        const key = address.toLowerCase();
        if (!labeled.has(key)) {
          labeled.set(key, { address, label, category: categorize(label) });
        }
      }
    };

    collect(TreasuryAddresses[this.daoId] ?? {});
    collect(NonCirculatingAddresses[this.daoId] ?? {});

    return { items: Array.from(labeled.values()) };
  }
}
