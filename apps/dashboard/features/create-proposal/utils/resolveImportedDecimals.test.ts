import type { PendingAction } from "@/features/create-proposal/utils/parseProposalJson";
import {
  needsDecimalsLookup,
  resolveImportedDecimals,
} from "@/features/create-proposal/utils/resolveImportedDecimals";

const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

const erc20 = (overrides: Partial<PendingAction> = {}): PendingAction =>
  ({
    type: "erc20-transfer",
    recipient: "0x1111111111111111111111111111111111111111",
    tokenAddress: USDC,
    amount: "1",
    ...overrides,
  }) as PendingAction;

const ethTransfer: PendingAction = {
  type: "eth-transfer",
  recipient: "0x1111111111111111111111111111111111111111",
  amount: "1.5",
};

describe("needsDecimalsLookup", () => {
  it("is false without an ERC-20 transfer, so no RPC is required", () => {
    expect(needsDecimalsLookup([ethTransfer])).toBe(false);
    expect(needsDecimalsLookup([])).toBe(false);
  });

  it("is true as soon as one is present", () => {
    expect(needsDecimalsLookup([ethTransfer, erc20()])).toBe(true);
  });
});

describe("resolveImportedDecimals", () => {
  it("fills decimals from the token when the document omits them", async () => {
    const result = await resolveImportedDecimals([erc20()], async () => 6);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.actions[0]).toMatchObject({
      tokenAddress: USDC,
      decimals: 6,
    });
  });

  it("accepts a supplied value the token agrees with", async () => {
    const result = await resolveImportedDecimals(
      [erc20({ decimals: 6 } as Partial<PendingAction>)],
      async () => 6,
    );

    expect(result.ok).toBe(true);
  });

  // The bug this exists for: 1 USDC declared at 18 decimals encodes 1e18 base
  // units, a million times the amount the row displays.
  it("rejects a supplied value the token disagrees with", async () => {
    const result = await resolveImportedDecimals(
      [erc20({ decimals: 18 } as Partial<PendingAction>)],
      async () => 6,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("actions[0].decimals");
    expect(result.error).toContain("reports 6, not 18");
  });

  it("reports which action failed when the read throws", async () => {
    const result = await resolveImportedDecimals(
      [ethTransfer, erc20()],
      async () => {
        throw new Error("execution reverted");
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("actions[1].tokenAddress");
    expect(result.error).toContain("couldn't read decimals");
  });

  it("rejects a contract that answers with something unusable", async () => {
    const result = await resolveImportedDecimals(
      [erc20()],
      async () => Number.NaN,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("actions[0].tokenAddress");
  });

  it("passes other action types through untouched and never reads", async () => {
    const read = jest.fn();
    const custom: PendingAction = {
      type: "custom",
      contractAddress: "0x3333333333333333333333333333333333333333",
      abi: [],
      functionName: "",
      args: [],
      calldata: "0xa9059cbb",
    };

    const result = await resolveImportedDecimals([ethTransfer, custom], read);

    expect(read).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.actions).toEqual([ethTransfer, custom]);
  });

  it("resolves each transfer against its own token", async () => {
    const dai = "0x6b175474e89094c44da98b954eedeac495271d0f";
    const result = await resolveImportedDecimals(
      [erc20(), erc20({ tokenAddress: dai } as Partial<PendingAction>)],
      async (token) => (token === USDC ? 6 : 18),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.actions.map((a) => "decimals" in a && a.decimals)).toEqual([
      6, 18,
    ]);
  });
});
