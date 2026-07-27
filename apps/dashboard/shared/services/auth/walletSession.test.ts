import { isWalletSessionStale } from "@/shared/services/auth/walletSession";

const WALLET_A = "0xAbCdEf0000000000000000000000000000000001";
const WALLET_B = "0x0000000000000000000000000000000000000002";

describe("isWalletSessionStale", () => {
  test("same account, in any casing, is not stale", () => {
    expect(
      isWalletSessionStale({
        sessionUserName: WALLET_A,
        walletStatus: "connected",
        address: WALLET_A.toLowerCase(),
      }),
    ).toBe(false);
  });

  test("a switch to another account is stale", () => {
    expect(
      isWalletSessionStale({
        sessionUserName: WALLET_A,
        walletStatus: "connected",
        address: WALLET_B,
      }),
    ).toBe(true);
  });

  test("a disconnected wallet is stale", () => {
    expect(
      isWalletSessionStale({
        sessionUserName: WALLET_A,
        walletStatus: "disconnected",
        address: undefined,
      }),
    ).toBe(true);
  });

  test.each(["connecting", "reconnecting"] as const)(
    "%s is not stale, the wallet has not reported an account yet",
    (walletStatus) => {
      expect(
        isWalletSessionStale({
          sessionUserName: WALLET_A,
          walletStatus,
          address: undefined,
        }),
      ).toBe(false);
    },
  );

  test("email and Google sessions never go stale", () => {
    for (const sessionUserName of ["Ada Lovelace", "", null, undefined]) {
      expect(
        isWalletSessionStale({
          sessionUserName,
          walletStatus: "disconnected",
          address: undefined,
        }),
      ).toBe(false);
      expect(
        isWalletSessionStale({
          sessionUserName,
          walletStatus: "connected",
          address: WALLET_B,
        }),
      ).toBe(false);
    }
  });
});
