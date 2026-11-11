import { zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

import { isNftBurnTransfer } from "./nft-supply";

const HOLDER = "0x70dc2A4614F057e6D711cd8fF0864dd90BF2fF3d";
const DEAD = "0x000000000000000000000000000000000000dEaD";

describe("isNftBurnTransfer", () => {
  it("treats a transfer to zero or dead as a burn", () => {
    expect(isNftBurnTransfer(HOLDER, zeroAddress)).toBe(true);
    expect(isNftBurnTransfer(HOLDER, DEAD)).toBe(true);
  });

  it("does not treat a mint or an ordinary transfer as a burn", () => {
    expect(isNftBurnTransfer(zeroAddress, HOLDER)).toBe(false);
    expect(
      isNftBurnTransfer(HOLDER, "0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71"),
    ).toBe(false);
  });
});
