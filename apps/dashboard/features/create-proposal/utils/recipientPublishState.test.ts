import { DaoIdEnum } from "@/shared/types/daos";

import { getRecipientPublishState } from "./recipientPublishState";

describe("getRecipientPublishState", () => {
  it("returns 'disconnected' when no address", () => {
    expect(
      getRecipientPublishState({
        daoId: DaoIdEnum.ENS,
        address: undefined,
        votingPower: 0n,
        threshold: 100n,
      }),
    ).toBe("disconnected");
  });

  it("returns 'below-threshold' when voting power is under the threshold", () => {
    expect(
      getRecipientPublishState({
        daoId: DaoIdEnum.ENS,
        address: "0xabc",
        votingPower: 38n,
        threshold: 100n,
      }),
    ).toBe("below-threshold");
  });

  it("returns 'eligible' when voting power meets the threshold", () => {
    expect(
      getRecipientPublishState({
        daoId: DaoIdEnum.ENS,
        address: "0xabc",
        votingPower: 100n,
        threshold: 100n,
      }),
    ).toBe("eligible");
  });

  it("requires strictly more than the threshold on GovernorBravo daos", () => {
    expect(
      getRecipientPublishState({
        daoId: DaoIdEnum.UNISWAP,
        address: "0xabc",
        votingPower: 100n,
        threshold: 100n,
      }),
    ).toBe("below-threshold");
    expect(
      getRecipientPublishState({
        daoId: DaoIdEnum.UNISWAP,
        address: "0xabc",
        votingPower: 101n,
        threshold: 100n,
      }),
    ).toBe("eligible");
  });

  it("treats an empty address as disconnected", () => {
    expect(
      getRecipientPublishState({
        daoId: DaoIdEnum.ENS,
        address: "",
        votingPower: 100n,
        threshold: 100n,
      }),
    ).toBe("disconnected");
  });
});
