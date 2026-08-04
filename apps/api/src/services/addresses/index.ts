import { Address } from "viem";

import { NonCirculatingAddresses, TreasuryAddresses } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { AddressLabelItem, AddressLabelsResponse } from "@/mappers";

// Unlock contracts whose label does not mention vesting, so the label alone
// cannot classify them. Referenced off the source records rather than retyped,
// so an address can never drift from the list it came from.
//
// The rest of NonCirculatingAddresses stays out on purpose, because an outgoing
// transfer from those is not an unlock: ZK's Merkle distributors pay airdrop
// claims, AAVE's LEND migrator is permanently locked with the migration
// discontinued, and TORN's vault hands a staker back their own deposit.
const VESTING_ADDRESSES: ReadonlySet<string> = new Set(
  [
    // Linear vesting for contributors, unlock end Dec 2025
    NonCirculatingAddresses[DaoIdEnum.ENS]["Token Timelock"],
    // ZK Nation allocations, released to their holders over time
    NonCirculatingAddresses[DaoIdEnum.ZK]["Matter Labs Allocation"],
    NonCirculatingAddresses[DaoIdEnum.ZK]["Foundation Allocation"],
    NonCirculatingAddresses[DaoIdEnum.ZK]["Guardians Allocation"],
    NonCirculatingAddresses[DaoIdEnum.ZK]["Security Council Allocation"],
    NonCirculatingAddresses[DaoIdEnum.ZK]["ZKsync Association Allocation"],
  ]
    // A renamed key drops out here rather than landing as undefined; the unit
    // tests read the same keys, so the rename fails there instead of silently
    // reclassifying the address as treasury.
    .filter((address): address is Address => address !== undefined)
    .map((address) => address.toLowerCase()),
);

// A label mentioning vesting ("Vesting Address", "treasuryVester") classifies
// itself; the rest is treasury unless the address is a known unlock contract.
const categorize = (
  label: string,
  address: Address,
): AddressLabelItem["category"] =>
  label.toLowerCase().includes("vest") ||
  VESTING_ADDRESSES.has(address.toLowerCase())
    ? "vesting"
    : "treasury";

export class AddressLabelsService {
  constructor(private readonly daoId: DaoIdEnum) {}

  getAddressLabels(): AddressLabelsResponse {
    const labeled = new Map<string, AddressLabelItem>();

    const collect = (entries: Record<string, Address>) => {
      for (const [label, address] of Object.entries(entries)) {
        const key = address.toLowerCase();
        if (!labeled.has(key)) {
          labeled.set(key, {
            address,
            label,
            category: categorize(label, address),
          });
        }
      }
    };

    collect(TreasuryAddresses[this.daoId] ?? {});
    collect(NonCirculatingAddresses[this.daoId] ?? {});

    return { items: Array.from(labeled.values()) };
  }
}
