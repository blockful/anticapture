import { customActionIssues } from "@/features/create-proposal/utils/validateCustomAction";

const abiOf = (inputs: unknown[], name = "call", extra: object = {}) => [
  {
    type: "function",
    name,
    stateMutability: "nonpayable",
    inputs,
    outputs: [],
    ...extra,
  },
];

const action = (overrides: Record<string, unknown> = {}) => ({
  abi: [] as unknown[],
  functionName: "",
  args: [] as string[],
  ...overrides,
});

/** A well-formed `setValue(address,uint256)` call, for overriding one part of. */
const call = (overrides: Record<string, unknown> = {}) =>
  action({
    abi: abiOf(
      [
        { name: "who", type: "address" },
        { name: "value", type: "uint256" },
      ],
      "setValue",
    ),
    functionName: "setValue(address,uint256)",
    args: ["vitalik.eth", "1"],
    ...overrides,
  });

/** A one-argument call, for exercising a single parameter type. */
const callTaking = (type: string, arg: string) =>
  action({
    abi: abiOf([{ name: "value", type }], "fine"),
    functionName: "fine",
    args: [arg],
  });

const expectIssue = (
  issues: ReturnType<typeof customActionIssues>,
  path: (string | number)[],
  fragment?: string,
) => {
  expect(issues.length).toBeGreaterThan(0);
  expect(issues[0].path).toEqual(path);
  if (fragment) expect(issues[0].message).toContain(fragment);
};

describe("customActionIssues", () => {
  it("passes a well-formed call", () => {
    expect(customActionIssues(call())).toEqual([]);
  });

  it("requires one of functionName or calldata", () => {
    expectIssue(customActionIssues(action()), ["functionName"], "Required");
  });

  describe("calldata", () => {
    it("accepts hex, and skips every abi check", () => {
      expect(
        customActionIssues(
          action({ calldata: "0xa9059cbb", abi: ["garbage"] }),
        ),
      ).toEqual([]);
    });

    it("accepts a bare 0x, the empty-calldata form viem produces", () => {
      expect(customActionIssues(action({ calldata: "0x" }))).toEqual([]);
    });

    // Without this the calldata is cast straight to Hex on the way to the
    // chain, so the paste only failed once the user was already signing.
    it.each([
      ["a function signature", "transfer(address,uint256)"],
      ["a non-hex string", "not calldata"],
      ["hex without the 0x prefix", "a9059cbb"],
      ["an odd number of characters", "0xa9059cb"],
    ])("rejects calldata that is %s", (_label, calldata) => {
      expectIssue(customActionIssues(action({ calldata })), ["calldata"]);
    });
  });

  describe("resolving the function", () => {
    it("requires an abi when a function name is used", () => {
      expectIssue(
        customActionIssues(action({ functionName: "setValue(uint256)" })),
        ["abi"],
      );
    });

    it("accepts a bare name that resolves to one function", () => {
      expect(customActionIssues(call({ functionName: "setValue" }))).toEqual(
        [],
      );
    });

    it("rejects a function that isn't in the abi", () => {
      expectIssue(
        customActionIssues(call({ functionName: "missing()", args: [] })),
        ["functionName"],
        "missing()",
      );
    });

    // The modal keeps view and pure out of its function list, so one of those
    // could never be selected there or hydrated on edit.
    it.each(["view", "pure"])("rejects a %s function", (stateMutability) => {
      expectIssue(
        customActionIssues(
          action({
            abi: abiOf([{ name: "who", type: "address" }], "balanceOf", {
              stateMutability,
              outputs: [{ name: "", type: "uint256" }],
            }),
            functionName: "balanceOf(address)",
            args: ["vitalik.eth"],
          }),
        ),
        ["functionName"],
        "only reads state",
      );
    });

    it("accepts a function with no stateMutability, as the modal does", () => {
      expect(
        customActionIssues(
          action({
            abi: [
              {
                type: "function",
                name: "legacy",
                inputs: [{ name: "value", type: "uint256" }],
                outputs: [],
              },
            ],
            functionName: "legacy(uint256)",
            args: ["1"],
          }),
        ),
      ).toEqual([]);
    });

    // uint accepts 0x hex, so an address-like arg satisfies foo(uint256) just
    // as well as foo(address): a bare name can't say which was meant, and
    // picking the first would publish that selector.
    describe("overloads", () => {
      const overloaded = (functionName: string) =>
        action({
          abi: [
            ...abiOf([{ name: "a", type: "uint256" }], "foo"),
            ...abiOf([{ name: "a", type: "address" }], "foo"),
          ],
          functionName,
          args: ["0x1111111111111111111111111111111111111111"],
        });

      it("rejects a bare name several functions share", () => {
        const issues = customActionIssues(overloaded("foo"));
        expectIssue(issues, ["functionName"], "foo(uint256)");
        expect(issues[0].message).toContain("foo(address)");
      });

      it.each(["foo(uint256)", "foo(address)"])("takes %s", (signature) => {
        expect(customActionIssues(overloaded(signature))).toEqual([]);
      });
    });
  });

  // An ABI array only guarantees a string `type`, so these survive it and used
  // to reach viem's formatter, or parseArrayType's `.match`, and throw. The bare
  // function name is the way in: it skips the signature formatter.
  describe("malformed entries", () => {
    it.each([
      ["no name", { type: "function", inputs: [], outputs: [] }],
      ["no inputs", { type: "function", name: "setValue", outputs: [] }],
      [
        "a non-string name",
        { type: "function", name: 42, inputs: [], outputs: [] },
      ],
      [
        "an input with no type",
        { type: "function", name: "x", inputs: [{}], outputs: [] },
      ],
    ])("reports an entry with %s instead of throwing", (_label, entry) => {
      const run = () =>
        customActionIssues(
          action({
            abi: [...abiOf([], "setValue"), entry],
            functionName: "setValue",
          }),
        );

      expect(run).not.toThrow();
      expectIssue(run(), ["abi"]);
    });
  });

  describe("parameter types", () => {
    // bytes33, function and fixed throw in viem's encoder; uint257 and
    // uint256[abc] are worse, since viem matches them on startsWith("uint") and
    // encodes something the declared type never described.
    it.each([
      ["an out-of-range integer width", "uint257"],
      ["an unaligned integer width", "uint7"],
      ["an out-of-range bytes width", "bytes33"],
      ["a broken array suffix", "uint256[abc]"],
      ["a type viem cannot encode", "function"],
      ["a fixed-point type", "fixed128x18"],
      ["a nonsense type", "notAType"],
    ])("rejects %s", (_label, type) => {
      expectIssue(customActionIssues(callTaking(type, "1")), ["abi"], type);
    });

    it.each([
      ["address", "vitalik.eth"],
      ["bool", "true"],
      ["bytes", "0xdeadbeef"],
      ["uint", "1"],
      ["int128", "-1"],
      ["uint256[]", "[]"],
    ])("accepts %s", (type, arg) => {
      expect(customActionIssues(callTaking(type, arg))).toEqual([]);
    });

    // Only the called function matters, so a real contract's ABI isn't refused
    // over an exotic entry nobody is invoking.
    it("ignores an unencodable type in a function it isn't calling", () => {
      expect(
        customActionIssues(
          action({
            abi: [
              ...abiOf([{ name: "cb", type: "function" }], "exotic"),
              ...abiOf([{ name: "value", type: "uint256" }], "plain"),
            ],
            functionName: "plain",
            args: ["1"],
          }),
        ),
      ).toEqual([]);
    });

    // The encoder throws on a tuple whose components are missing, so the ABI has
    // to declare them for the action to be encodable at all.
    it.each([
      ["a bare tuple", "tuple"],
      ["a tuple array", "tuple[]"],
    ])("rejects %s with no components", (_label, type) => {
      expectIssue(customActionIssues(callTaking(type, "[]")), ["abi"]);
    });
  });

  describe("arguments", () => {
    it.each([
      ["too few", []],
      ["too many", ["vitalik.eth", "1", "2"]],
    ])("rejects %s for the function", (_label, args) => {
      expectIssue(customActionIssues(call({ args })), ["args"], "takes 2");
    });

    it.each([
      ["one that doesn't fit its type", ["not-an-address", "1"], 0],
      ["a blank one", ["vitalik.eth", "  "], 1],
    ])("rejects %s", (_label, args, index) => {
      expectIssue(customActionIssues(call({ args })), ["args", index]);
    });

    describe("composites", () => {
      const withArg = (arg: string) =>
        customActionIssues(callTaking("uint256[]", arg));

      it("accepts a JSON array", () => {
        expect(withArg('["1", "2"]')).toEqual([]);
      });

      // storageToArg swallows the parse error and hands back an empty array,
      // which isArgComplete calls complete, so the action looked ready and the
      // encoder threw on the original text.
      it.each([
        ["isn't JSON", "not json"],
        ["is JSON but not an array", '{"nope":1}'],
      ])("rejects a composite that %s", (_label, arg) => {
        expectIssue(withArg(arg), ["args", 0], "Must be a JSON array");
      });

      it("rejects an array whose elements don't fit the type", () => {
        expectIssue(withArg('["not a number"]'), ["args", 0]);
      });

      // isArgComplete walks the declared components, so anything past them is
      // never looked at, and the encoder maps components only: the extra value
      // vanishes from the calldata without a word.
      describe("tuple field counts", () => {
        const pair = (type: string, arg: string) =>
          customActionIssues(
            action({
              abi: abiOf(
                [
                  {
                    name: "data",
                    type,
                    components: [
                      { name: "who", type: "address" },
                      { name: "value", type: "uint256" },
                    ],
                  },
                ],
                "setPair",
              ),
              functionName: "setPair",
              args: [arg],
            }),
          );

        it("accepts a tuple with exactly its components", () => {
          expect(pair("tuple", '["vitalik.eth", "1"]')).toEqual([]);
        });

        it.each([
          ["one field too many", '["vitalik.eth", "1", "unexpected"]'],
          ["one field short", '["vitalik.eth"]'],
        ])("rejects a tuple with %s", (_label, arg) => {
          expectIssue(pair("tuple", arg), ["args", 0]);
        });

        it("rejects an over-filled tuple nested in an array", () => {
          expectIssue(
            pair(
              "tuple[]",
              '[["vitalik.eth", "1"], ["vitalik.eth", "1", "x"]]',
            ),
            ["args", 0],
          );
        });
      });
    });
  });
});
