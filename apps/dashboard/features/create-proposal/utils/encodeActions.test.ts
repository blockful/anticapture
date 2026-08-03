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

  // The publish path and the modal's live preview now run the same conversion,
  // via argTree, so anything validation accepts encodes the same either way.
  describe("arg conversion", () => {
    const CONTRACT = "0x3333333333333333333333333333333333333333";
    const abiWith = (type: string): Abi =>
      [
        {
          type: "function",
          name: "f",
          stateMutability: "nonpayable",
          inputs: [{ name: "a", type }],
          outputs: [],
        },
      ] as Abi;

    const encodeOne = (type: string, arg: string) =>
      encodeActions(
        [
          {
            type: "custom",
            contractAddress: CONTRACT,
            abi: abiWith(type),
            functionName: "f",
            args: [arg],
          } as ProposalAction,
        ],
        passthrough,
      );

    // validateSolidityArg trims before it checks, so these read as valid and
    // used to throw here, leaving the form publishable and the publish broken.
    test.each([
      ["bool", " true ", "true"],
      ["bytes32", ` 0x${"11".repeat(32)} `, `0x${"11".repeat(32)}`],
      ["uint256", " 42 ", "42"],
    ])(
      "normalizes a %s arg the way validation reads it",
      async (type, padded, tidy) => {
        const [loose, exact] = await Promise.all([
          encodeOne(type, padded),
          encodeOne(type, tidy),
        ]);
        expect(loose.calldatas).toEqual(exact.calldatas);
      },
    );

    test("keeps whitespace inside a string arg", async () => {
      const { calldatas } = await encodeOne("string", "  urgent  ");
      expect(calldatas[0]).toBe(
        encodeFunctionData({
          abi: abiWith("string"),
          functionName: "f",
          args: ["  urgent  "],
        }),
      );
    });

    test("takes a JSON bool array written with real booleans", async () => {
      const { calldatas } = await encodeOne("bool[]", "[true, false]");
      expect(calldatas[0]).toBe(
        encodeFunctionData({
          abi: abiWith("bool[]"),
          functionName: "f",
          args: [[true, false]],
        }),
      );
    });

    test("still refuses a fixed array of the wrong length", async () => {
      await expect(encodeOne("uint256[2]", '["1"]')).rejects.toThrow();
    });

    test("resolves an ENS name nested inside an array", async () => {
      const resolver = makeAddressResolver(async (name) =>
        name === "vitalik.eth"
          ? "0x1111111111111111111111111111111111111111"
          : null,
      );
      const { calldatas } = await encodeActions(
        [
          {
            type: "custom",
            contractAddress: CONTRACT,
            abi: abiWith("address[]"),
            functionName: "f",
            args: ['["vitalik.eth"]'],
          } as ProposalAction,
        ],
        resolver,
      );
      expect(calldatas[0]).toBe(
        encodeFunctionData({
          abi: abiWith("address[]"),
          functionName: "f",
          args: [["0x1111111111111111111111111111111111111111"]],
        }),
      );
    });
  });
});
