import {
  encodeActions,
  makeAddressResolver,
} from "@/features/create-proposal/utils/encodeActions";
import { argsToTreesForDisplay } from "@/features/create-proposal/utils/argTree";
import type { ProposalAction } from "@/features/create-proposal/types";
import {
  parseEther,
  parseUnits,
  encodeFunctionData,
  erc20Abi,
  type Abi,
} from "viem";

const passthrough = makeAddressResolver(async () => null);

describe("makeAddressResolver", () => {
  // Matched strictly, a miscased address isn't recognized as an address and
  // falls through to the ENS branch, which fails with "Could not resolve ENS
  // name 0x39D3…", at publish, for a document the form already accepted.
  const miscased = "0x39D3F4633dE1F5E2a1e2f4d3fD6d1AAf2E9c8b71";
  const checksummed = "0x39D3f4633de1F5E2A1E2f4D3fD6D1AAF2E9C8B71";

  test("normalizes a miscased address instead of treating it as a name", async () => {
    const resolve = makeAddressResolver(async () => {
      throw new Error("ENS lookup should not be reached for an address");
    });
    await expect(resolve(miscased)).resolves.toBe(checksummed);
  });

  test("still routes an actual name through ENS", async () => {
    const resolve = makeAddressResolver(async () => checksummed);
    await expect(resolve("vitalik.eth")).resolves.toBe(checksummed);
  });

  test("refuses something that is neither", async () => {
    await expect(passthrough(miscased.slice(0, -1))).rejects.toThrow();
  });
});

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

    // A shared or API draft is rendered straight from stored data, so it can
    // reach the encoder without passing ProposalFormSchema. The forgiving
    // conversion reads a malformed composite as an empty container, which
    // encodes to entirely valid calldata for an empty array: the publish would
    // succeed and send a call the action row never described.
    describe("malformed composite args fail closed", () => {
      test.each([
        ["unparseable text", "not json"],
        ["JSON that isn't an array", '"42"'],
        ["JSON null", "null"],
        ["nothing at all", ""],
      ])("refuses a uint256[] arg holding %s", async (_case, arg) => {
        await expect(encodeOne("uint256[]", arg)).rejects.toThrow(
          /must be a JSON array for uint256\[\]/,
        );
      });

      test("refuses a malformed tuple arg", async () => {
        const tupleAbi = [
          {
            type: "function",
            name: "f",
            stateMutability: "nonpayable",
            inputs: [
              {
                name: "order",
                type: "tuple",
                components: [
                  { name: "id", type: "uint256" },
                  { name: "owner", type: "address" },
                ],
              },
            ],
            outputs: [],
          },
        ] as Abi;
        await expect(
          encodeActions(
            [
              {
                type: "custom",
                contractAddress: CONTRACT,
                abi: tupleAbi,
                functionName: "f",
                args: ["not json"],
              } as ProposalAction,
            ],
            passthrough,
          ),
        ).rejects.toThrow(/must be a JSON array for tuple/);
      });

      // What the malformed arg used to encode as, so the regression is legible:
      // this is the calldata the refusals above would otherwise have published.
      test("an explicitly empty array is still encodable", async () => {
        const { calldatas } = await encodeOne("uint256[]", "[]");
        expect(calldatas[0]).toBe(
          encodeFunctionData({
            abi: abiWith("uint256[]"),
            functionName: "f",
            args: [[]],
          }),
        );
      });

      // Stringifying a leaf is the same failure one level down: `String(null)`
      // is "null" and `String({})` is "[object Object]", both of which pass as
      // a filled-in `string` leaf, so the publish would have carried a value
      // nobody wrote instead of failing closed.
      test.each([
        ["a null element", "string[]", "[null]"],
        ["an object element", "string[]", "[{}]"],
        ["a null element", "uint256[]", "[1, null]"],
      ])("refuses %s in a %s arg", async (_case, type, arg) => {
        await expect(encodeOne(type, arg)).rejects.toThrow(/expects a value/);
      });

      // A leaf sitting where the ABI says a list goes, and the reverse: both
      // describe a different call than the action row does.
      test("refuses a nested list where the element is a scalar", async () => {
        await expect(encodeOne("uint256[]", "[[1]]")).rejects.toThrow(
          /expects a value/,
        );
      });

      test("refuses a scalar where the element is a list", async () => {
        await expect(encodeOne("uint256[][]", '["1"]')).rejects.toThrow(
          /must be a JSON array for uint256\[\]/,
        );
      });

      test("refuses a tuple carrying more entries than it has components", async () => {
        const tupleAbi = [
          {
            type: "function",
            name: "f",
            stateMutability: "nonpayable",
            inputs: [
              {
                name: "order",
                type: "tuple",
                components: [{ name: "id", type: "uint256" }],
              },
            ],
            outputs: [],
          },
        ] as Abi;
        await expect(
          encodeActions(
            [
              {
                type: "custom",
                contractAddress: CONTRACT,
                abi: tupleAbi,
                functionName: "f",
                args: ['["1","2"]'],
              } as ProposalAction,
            ],
            passthrough,
          ),
        ).rejects.toThrow(/2 entries for a tuple of 1/);
      });

      // The other direction, and the worse one: a missing field used to be
      // filled in with "", so a draft that omitted `memo` published calldata
      // carrying an empty string nobody wrote.
      test("refuses a tuple carrying fewer entries than it has components", async () => {
        const tupleAbi = [
          {
            type: "function",
            name: "f",
            stateMutability: "nonpayable",
            inputs: [
              {
                name: "order",
                type: "tuple",
                components: [{ name: "memo", type: "string" }],
              },
            ],
            outputs: [],
          },
        ] as Abi;
        await expect(
          encodeActions(
            [
              {
                type: "custom",
                contractAddress: CONTRACT,
                abi: tupleAbi,
                functionName: "f",
                args: ["[]"],
              } as ProposalAction,
            ],
            passthrough,
          ),
        ).rejects.toThrow(/0 entries for a tuple of 1/);
      });

      // The other side of the same coin: the modal's live preview has to keep
      // rendering while an array is half-typed, so its conversion stays lenient.
      test("the live preview conversion still degrades instead of throwing", () => {
        const inputs = [{ name: "a", type: "uint256[]" }] as const;
        expect(argsToTreesForDisplay(inputs, ["not json"])).toEqual([[]]);
      });
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
