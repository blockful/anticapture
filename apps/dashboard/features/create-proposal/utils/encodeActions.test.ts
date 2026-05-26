import {
  encodeActions,
  makeAddressResolver,
} from "@/features/create-proposal/utils/encodeActions";
import type { ProposalAction } from "@/features/create-proposal/types";
import {
  parseEther,
  parseUnits,
  encodeFunctionData,
  erc20Abi,
  type Abi,
} from "viem";

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

  test("custom action with overloaded function encodes by signature", async () => {
    const overloadedAbi: Abi = [
      {
        type: "function",
        name: "execute",
        stateMutability: "nonpayable",
        inputs: [{ name: "id", type: "uint256" }],
        outputs: [],
      },
      {
        type: "function",
        name: "execute",
        stateMutability: "nonpayable",
        inputs: [
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
        ],
        outputs: [],
      },
    ];
    const actions: ProposalAction[] = [
      {
        type: "custom",
        contractAddress: "0x5555555555555555555555555555555555555555",
        abi: overloadedAbi,
        // The picker stores the full signature so overloads stay distinct.
        functionName: "execute(address,uint256)",
        args: ["0x6666666666666666666666666666666666666666", "42"],
      },
    ];
    const result = await encodeActions(actions, passthrough);
    expect(result.calldatas[0]).toBe(
      encodeFunctionData({
        abi: [overloadedAbi[1]!],
        functionName: "execute",
        args: ["0x6666666666666666666666666666666666666666", "42"] as never,
      }),
    );
  });

  test("custom action throws when functionName has no ABI match", async () => {
    const actions: ProposalAction[] = [
      {
        type: "custom",
        contractAddress: "0x5555555555555555555555555555555555555555",
        abi: [
          {
            type: "function",
            name: "transfer",
            stateMutability: "nonpayable",
            inputs: [
              { name: "to", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ type: "bool" }],
          },
        ],
        functionName: "missing()",
        args: [],
      },
    ];
    await expect(encodeActions(actions, passthrough)).rejects.toThrow(
      /Function "missing\(\)" not found/,
    );
  });
});
