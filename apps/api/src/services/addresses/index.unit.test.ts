import { NonCirculatingAddresses, TreasuryAddresses } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

import { AddressLabelsService } from ".";

describe("AddressLabelsService", () => {
  it("returns treasury and vesting labels for the DAO", () => {
    const service = new AddressLabelsService(DaoIdEnum.UNI);

    const { items } = service.getAddressLabels();

    expect(items).toContainEqual({
      address: TreasuryAddresses[DaoIdEnum.UNI].timelock,
      label: "timelock",
      category: "treasury",
    });
    expect(items).toContainEqual({
      address: TreasuryAddresses[DaoIdEnum.UNI].treasuryVester1,
      label: "treasuryVester1",
      category: "vesting",
    });
    expect(items).toHaveLength(
      Object.keys(TreasuryAddresses[DaoIdEnum.UNI]).length +
        Object.keys(NonCirculatingAddresses[DaoIdEnum.UNI]).length,
    );
  });

  it("categorizes labels containing 'vest' as vesting regardless of casing", () => {
    const service = new AddressLabelsService(DaoIdEnum.ARB);

    const { items } = service.getAddressLabels();

    expect(items).toContainEqual({
      address: TreasuryAddresses[DaoIdEnum.ARB]["Foundation Vesting Wallet"],
      label: "Foundation Vesting Wallet",
      category: "vesting",
    });
    expect(items).toContainEqual({
      address: TreasuryAddresses[DaoIdEnum.ARB]["DAO Treasury"],
      label: "DAO Treasury",
      category: "treasury",
    });
  });

  // The dashboard only relabels an incoming transfer as a vesting unlock when
  // the source address comes back as `vesting`, so an unlock contract whose
  // label does not say "vest" has to be classified by address.
  it("classifies an unlock contract whose label omits vesting as vesting", () => {
    const service = new AddressLabelsService(DaoIdEnum.ENS);

    const { items } = service.getAddressLabels();

    expect(items).toContainEqual({
      address: NonCirculatingAddresses[DaoIdEnum.ENS]["Token Timelock"],
      label: "Token Timelock",
      category: "vesting",
    });
  });

  it("classifies ZK allocations as vesting and its distributors as treasury", () => {
    const service = new AddressLabelsService(DaoIdEnum.ZK);

    const { items } = service.getAddressLabels();

    expect(items).toContainEqual({
      address: NonCirculatingAddresses[DaoIdEnum.ZK]["Matter Labs Allocation"],
      label: "Matter Labs Allocation",
      category: "vesting",
    });
    // A transfer out of a distributor is an airdrop claim, not an unlock.
    expect(items).toContainEqual({
      address:
        NonCirculatingAddresses[DaoIdEnum.ZK]["Initial Merkle Distributor"],
      label: "Initial Merkle Distributor",
      category: "treasury",
    });
  });

  it("keeps a staking vault out of vesting", () => {
    const service = new AddressLabelsService(DaoIdEnum.TORN);

    const { items } = service.getAddressLabels();

    // Transfers out return a staker their own deposit.
    expect(items).toContainEqual({
      address: NonCirculatingAddresses[DaoIdEnum.TORN].vault,
      label: "vault",
      category: "treasury",
    });
  });

  it("is deterministic across calls", () => {
    const service = new AddressLabelsService(DaoIdEnum.GTC);

    expect(service.getAddressLabels()).toEqual(service.getAddressLabels());
  });
});
