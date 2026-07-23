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

  it("includes non-circulating addresses", () => {
    const service = new AddressLabelsService(DaoIdEnum.ENS);

    const { items } = service.getAddressLabels();

    expect(items).toContainEqual({
      address: NonCirculatingAddresses[DaoIdEnum.ENS]["Token Timelock"],
      label: "Token Timelock",
      category: "treasury",
    });
  });

  it("is deterministic across calls", () => {
    const service = new AddressLabelsService(DaoIdEnum.GTC);

    expect(service.getAddressLabels()).toEqual(service.getAddressLabels());
  });
});
