import {
  encodeActions,
  makeAddressResolver,
} from "@/features/create-proposal/utils/encodeActions";
import type { ProposalAction } from "@/features/create-proposal/types";
import { parseEther, parseUnits, encodeFunctionData, erc20Abi } from "viem";

const passthrough = makeAddressResolver(async () => null);

describe("encodeActions", () => {
  test("eth-transfer → target=recipient, value=wei, calldata=0x", async () => {
    const actions: ProposalAction[] = [
      {
        type: "eth-transfer",
        recipient: "0x1111111111111111111111111111111111111111",
        amount: "1.5",
      },
    ];
    const result = await encodeActions(actions, passthrough);
    expect(result.targets).toEqual([
      "0x1111111111111111111111111111111111111111",
    ]);
    expect(result.values).toEqual([parseEther("1.5")]);
    expect(result.calldatas).toEqual(["0x"]);
  });

  test("erc20-transfer → target=token, value=0, calldata=transfer(...)", async () => {
    const actions: ProposalAction[] = [
      {
        type: "erc20-transfer",
        recipient: "0x2222222222222222222222222222222222222222",
        tokenAddress: "0x3333333333333333333333333333333333333333",
        amount: "10",
        decimals: 18,
      },
    ];
    const result = await encodeActions(actions, passthrough);
    expect(result.targets).toEqual([
      "0x3333333333333333333333333333333333333333",
    ]);
    expect(result.values).toEqual([0n]);
    expect(result.calldatas[0]).toBe(
      encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [
          "0x2222222222222222222222222222222222222222",
          parseUnits("10", 18),
        ],
      }),
    );
  });

  test("resolves ENS names to addresses", async () => {
    const resolver = makeAddressResolver(async (name) => {
      if (name === "alice.eth")
        return "0x4444444444444444444444444444444444444444";
      return null;
    });
    const actions: ProposalAction[] = [
      { type: "eth-transfer", recipient: "alice.eth", amount: "1" },
    ];
    const result = await encodeActions(actions, resolver);
    expect(result.targets).toEqual([
      "0x4444444444444444444444444444444444444444",
    ]);
  });

  test("throws when ENS name cannot be resolved", async () => {
    const actions: ProposalAction[] = [
      { type: "eth-transfer", recipient: "nonexistent.eth", amount: "1" },
    ];
    await expect(encodeActions(actions, passthrough)).rejects.toThrow(
      /Could not resolve ENS name/,
    );
  });
});
