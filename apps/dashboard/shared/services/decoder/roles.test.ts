import { keccak256, stringToBytes, zeroHash } from "viem";

import { lookupRoleName } from "@/shared/services/decoder/roles";

describe("lookupRoleName", () => {
  test("names the hashes of common roles, whatever the case of the hex", () => {
    const hash = keccak256(stringToBytes("PROPOSER_ROLE"));
    expect(lookupRoleName(hash)).toBe("PROPOSER_ROLE");
    expect(lookupRoleName(hash.toUpperCase().replace("0X", "0x"))).toBe(
      "PROPOSER_ROLE",
    );
  });

  test("the zero hash is the AccessControl admin role", () => {
    expect(lookupRoleName(zeroHash)).toBe("DEFAULT_ADMIN_ROLE");
  });

  test("an unknown hash stays unnamed", () => {
    expect(lookupRoleName(keccak256(stringToBytes("MY_CUSTOM_ROLE")))).toBe(
      undefined,
    );
  });
});
