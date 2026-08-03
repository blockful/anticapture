import { PROPOSAL_JSON_PLACEHOLDER } from "@/features/create-proposal/constants";
import {
  parseProposalJson,
  type ParseProposalJsonResult,
} from "@/features/create-proposal/utils/parseProposalJson";

const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const CONTRACT = "0x3333333333333333333333333333333333333333";

const parse = (...actions: unknown[]) =>
  parseProposalJson(JSON.stringify({ actions }));

const expectOk = (result: ParseProposalJsonResult) => {
  if (!result.ok)
    throw new Error(`expected a valid document, got: ${result.error}`);
  return result.value;
};

const expectRejected = (
  result: ParseProposalJsonResult,
  ...fragments: string[]
) => {
  if (result.ok) throw new Error("expected a rejection, got a valid document");
  fragments.forEach((fragment) => expect(result.error).toContain(fragment));
  return result.error;
};

const eth = (overrides: Record<string, unknown> = {}) => ({
  type: "eth-transfer",
  recipient: "vitalik.eth",
  amount: "1.5",
  ...overrides,
});

const erc20 = (overrides: Record<string, unknown> = {}) => ({
  type: "erc20-transfer",
  recipient: "vitalik.eth",
  tokenAddress: USDC,
  amount: "1",
  ...overrides,
});

const custom = (overrides: Record<string, unknown> = {}) => ({
  type: "custom",
  contractAddress: CONTRACT,
  ...overrides,
});

const abiOf = (inputs: unknown[], name = "call") => [
  {
    type: "function",
    name,
    stateMutability: "nonpayable",
    inputs,
    outputs: [],
  },
];

/** A well-formed `setValue(address,uint256)` call, for overriding one part of. */
const abiCall = (overrides: Record<string, unknown> = {}) =>
  custom({
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
  custom({
    abi: abiOf([{ name: "value", type }], "fine"),
    functionName: "fine",
    args: [arg],
  });

describe("parseProposalJson", () => {
  describe("the document", () => {
    // The placeholder is a shape hint, not a document: it puts "0x…" where real
    // values go, so it can't be parsed. Guard its structure instead, so a typo
    // there can't quietly teach the wrong format.
    it("keeps the modal's format hint in step with what it reads", () => {
      const hint = JSON.parse(PROPOSAL_JSON_PLACEHOLDER) as {
        actions: { type: string }[];
      };

      expect(Object.keys(hint)).toEqual([
        "title",
        "discussionUrl",
        "body",
        "actions",
      ]);
      expect(hint.actions.map((a) => a.type)).toEqual([
        "eth-transfer",
        "custom",
      ]);
    });

    it("fills only the fields it carries", () => {
      expect(parseProposalJson('{"title":"Only a title"}')).toEqual({
        ok: true,
        value: {
          title: "Only a title",
          discussionUrl: undefined,
          body: undefined,
          actions: undefined,
        },
      });
    });

    it("ignores unknown keys, so a saved draft pastes in as-is", () => {
      const value = expectOk(
        parseProposalJson(
          JSON.stringify({
            id: "draft-1",
            daoId: "ens",
            createdAt: 1234,
            title: "From a draft",
            actions: [],
          }),
        ),
      );

      expect(value).toEqual({
        title: "From a draft",
        discussionUrl: undefined,
        body: undefined,
        actions: [],
      });
    });

    it.each([
      ["an empty paste", "   ", "Paste the proposal JSON first."],
      ["text that isn't JSON", "{ title: nope }", "valid JSON"],
      ["a top-level array", "[]", "Expected a JSON object"],
      ["an object with no known field", '{"foo":"bar"}', "No known fields"],
      ["a wrongly typed title", '{"title":42}', "title:"],
    ])("rejects %s", (_label, input, fragment) => {
      expectRejected(parseProposalJson(input), fragment);
    });

    it("reports at most three issues", () => {
      const error = expectRejected(
        parseProposalJson(
          JSON.stringify({ title: 1, body: 2, discussionUrl: 3, actions: 4 }),
        ),
      );

      expect(error.split("; ")).toHaveLength(3);
    });
  });

  describe("transfers", () => {
    it("accepts an ETH transfer", () => {
      expect(expectOk(parse(eth())).actions).toEqual([
        { type: "eth-transfer", recipient: "vitalik.eth", amount: "1.5" },
      ]);
    });

    // Left undecided here on purpose: resolveImportedDecimals settles it
    // against the token contract, since a pasted value would silently rescale
    // the transfer.
    it("leaves an omitted decimals undefined rather than guessing", () => {
      expect(expectOk(parse(erc20())).actions?.[0]).not.toHaveProperty(
        "decimals",
      );
    });

    // The form requires a concrete address here, and the decimals lookup needs
    // one too.
    it("rejects a token address that isn't an address", () => {
      expectRejected(
        parse(erc20({ tokenAddress: "usdc.eth" })),
        "actions[0].tokenAddress",
      );
    });

    // These would otherwise clear the import and then fail ProposalFormSchema,
    // which leaves Publish disabled with no visible reason: action rows render
    // no field errors.
    it.each([
      ["a recipient that is neither address nor ENS", { recipient: "banana" }],
      ["an amount that isn't a number", { amount: "a lot" }],
      ["a zero amount", { amount: "0" }],
      ["a negative amount", { amount: "-1" }],
    ])("rejects %s", (_label, overrides) => {
      expectRejected(parse(eth(overrides)), "actions[0]");
    });

    // Spliced in as raw text rather than written as TS numbers: the compiler
    // rounds them exactly like JSON.parse does, and eslint's
    // no-loss-of-precision flags them for that reason. By the time the schema
    // runs the original text is gone, so a number is refused outright:
    // 1.000000000000000001 is simply 1 here, indistinguishable from someone
    // writing 1.
    it.each([
      ["a fraction beyond a double", "0.123456789123456789"],
      ["a fraction that collapses to an integer", "1.000000000000000001"],
      ["an integer past 2^53", "1000000000000000001"],
      ["even a figure a double carries exactly", "1.5"],
    ])("rejects %s written unquoted", (_label, literal) => {
      expectRejected(
        parseProposalJson(
          `{"actions":[{"type":"eth-transfer","recipient":"vitalik.eth","amount":${literal}}]}`,
        ),
        "actions[0].amount",
        "quoted",
      );
    });

    it("takes the same figure quoted", () => {
      expect(
        expectOk(parse(eth({ amount: "0.123456789123456789" }))).actions?.[0],
      ).toMatchObject({ amount: "0.123456789123456789" });
    });
  });

  describe("custom actions", () => {
    it("rejects a contract address that is neither address nor ENS", () => {
      expectRejected(
        parse(custom({ contractAddress: "nope", calldata: "0xa9059cbb" })),
        "actions[0].contractAddress",
      );
    });

    it("rejects one with neither functionName nor calldata", () => {
      expectRejected(parse(custom()), "functionName");
    });

    describe("calldata", () => {
      it("accepts a calldata-only action, filling the unused fields", () => {
        expect(
          expectOk(parse(custom({ calldata: "0xa9059cbb" }))).actions,
        ).toEqual([
          {
            type: "custom",
            contractAddress: CONTRACT,
            abi: [],
            functionName: "",
            args: [],
            calldata: "0xa9059cbb",
          },
        ]);
      });

      // ProposalFormSchema only checks that calldata is non-empty, so without
      // this the form goes publishable and encodeActions casts the string
      // straight to Hex: the paste would only fail once the user is signing.
      it.each([
        ["a function signature", "transfer(address,uint256)"],
        ["a non-hex string", "not calldata"],
        ["hex without the 0x prefix", "a9059cbb"],
        ["an odd number of characters", "0xa9059cb"],
      ])("rejects calldata that is %s", (_label, calldata) => {
        expectRejected(parse(custom({ calldata })), "actions[0].calldata");
      });

      it("accepts a bare 0x, the empty-calldata form viem produces", () => {
        expectOk(parse(custom({ calldata: "0x" })));
      });
    });

    describe("value", () => {
      const withValue = (value: unknown) =>
        parse(custom({ calldata: "0xa9059cbb", value }));

      it.each([
        ["an integer in wei", "1000000000000000000"],
        ["hex, which BigInt() handles", "0xde0b6b3a7640000"],
      ])("accepts %s", (_label, value) => {
        expectOk(withValue(value));
      });

      it("rejects one BigInt() would throw on", () => {
        expectRejected(withValue("1e18"), "actions[0].value");
      });
    });
  });

  describe("abi-backed calls", () => {
    it("accepts a call whose function and args line up", () => {
      expect(expectOk(parse(abiCall())).actions?.[0]).toMatchObject({
        functionName: "setValue(address,uint256)",
        args: ["vitalik.eth", "1"],
      });
    });

    it("accepts the bare function name, like encodeActions does", () => {
      expectOk(parse(abiCall({ functionName: "setValue" })));
    });

    it("rejects a functionName with no abi to encode it against", () => {
      expectRejected(
        parse(custom({ functionName: "setValue(uint256)", args: ["1"] })),
        "actions[0].abi",
      );
    });

    it("rejects a malformed abi", () => {
      expectRejected(parse(abiCall({ abi: "not an abi" })), "actions[0].abi");
    });

    it("rejects a function that isn't in the abi", () => {
      expectRejected(
        parse(abiCall({ functionName: "missing()", args: [] })),
        "actions[0].functionName",
        "missing()",
      );
    });

    it.each([
      ["too few", []],
      ["too many", ["vitalik.eth", "1", "2"]],
      ["none at all", undefined],
    ])("rejects %s args for the function", (_label, args) => {
      expectRejected(parse(abiCall({ args })), "actions[0].args", "takes 2");
    });

    it.each([
      ["one that doesn't fit its solidity type", ["not-an-address", "1"]],
      ["a blank one", ["vitalik.eth", "  "]],
    ])("rejects %s", (_label, args) => {
      expectRejected(parse(abiCall({ args })), "actions[0].args");
    });

    it("rejects an unquoted arg, and takes it quoted", () => {
      expectRejected(
        parseProposalJson(
          `{"actions":[${JSON.stringify(abiCall()).replace('"1"', "1000000000000000001")}]}`,
        ),
        "actions[0].args[1]",
        "quoted",
      );
      expectOk(
        parse(abiCall({ args: ["vitalik.eth", "1000000000000000001"] })),
      );
    });

    it("skips every abi check when raw calldata is supplied", () => {
      expectOk(
        parse(abiCall({ functionName: "missing()", calldata: "0xa9059cbb" })),
      );
    });

    describe("malformed entries", () => {
      // parseAbiStrict only guarantees a string `type`, so these survive it and
      // used to reach viem's formatter (or parseArrayType's `.match`), which
      // throws and takes the whole import dialog down instead of reporting a
      // bad paste. The bare function name is the way in: it skips the
      // signature formatter that was already guarded.
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
      ])(
        "reports a function entry with %s instead of throwing",
        (_label, entry) => {
          const run = () =>
            parse(
              abiCall({
                abi: [...abiOf([], "setValue"), entry],
                functionName: "setValue",
                args: [],
              }),
            );

          expect(run).not.toThrow();
          expectRejected(run(), "actions[0].abi");
        },
      );
    });

    describe("parameter types", () => {
      // bytes33, function and fixed all throw in viem's encoder; uint257 and
      // uint256[abc] are worse, since viem matches them on startsWith("uint")
      // and encodes something the declared type never described.
      it.each([
        ["an out-of-range integer width", "uint257"],
        ["an unaligned integer width", "uint7"],
        ["an out-of-range bytes width", "bytes33"],
        ["a broken array suffix", "uint256[abc]"],
        ["a type viem cannot encode", "function"],
        ["a nonsense type", "notAType"],
      ])("rejects %s", (_label, type) => {
        expectRejected(parse(callTaking(type, "1")), "actions[0].abi", type);
      });

      it.each([
        ["address", "vitalik.eth"],
        ["bool", "true"],
        ["bytes", "0xdeadbeef"],
        ["uint", "1"],
        ["int128", "-1"],
        ["uint256[]", "[]"],
      ])("accepts %s", (type, arg) => {
        expectOk(parse(callTaking(type, arg)));
      });

      // encodeActions throws on a tuple whose components are missing, so the
      // ABI has to declare them for the action to be encodable at all.
      it.each([
        ["a bare tuple", "tuple"],
        ["a tuple array", "tuple[]"],
      ])("rejects %s with no components", (_label, type) => {
        expectRejected(parse(callTaking(type, "[]")), "actions[0].abi");
      });

      it("accepts a tuple that declares its components", () => {
        expectOk(
          parse(
            custom({
              abi: abiOf(
                [
                  {
                    name: "data",
                    type: "tuple",
                    components: [
                      { name: "who", type: "address" },
                      { name: "value", type: "uint256" },
                    ],
                  },
                ],
                "setStruct",
              ),
              functionName: "setStruct",
              args: ['["vitalik.eth", "1"]'],
            }),
          ),
        );
      });

      // Only the called function matters, so a real contract's ABI isn't
      // refused over an exotic entry nobody is invoking.
      it("ignores an unencodable type in a function it isn't calling", () => {
        expectOk(
          parse(
            custom({
              abi: [
                ...abiOf([{ name: "cb", type: "function" }], "exotic"),
                ...abiOf([{ name: "value", type: "uint256" }], "plain"),
              ],
              functionName: "plain",
              args: ["1"],
            }),
          ),
        );
      });
    });

    describe("composite args", () => {
      const withArg = (arg: string) => parse(callTaking("uint256[]", arg));

      it("accepts a JSON array with quoted leaves", () => {
        expectOk(withArg('["1", "2", "3"]'));
      });

      // storageToArg swallows the parse error and hands back an empty array,
      // which isArgComplete calls complete; encodeActions then re-parses the
      // original text at publish and throws.
      it.each([
        ["isn't JSON", "not json", "must be a JSON array"],
        ["is JSON but not an array", '{"nope":1}', "must be a JSON array"],
      ])("rejects a composite arg that %s", (_label, arg, fragment) => {
        expectRejected(withArg(arg), "actions[0].args[0]", fragment);
      });

      // The composite is JSON too, so an unquoted leaf is already rewritten
      // before it can be inspected, exactly as at the top level.
      it.each([
        ["a plain number", "[1, 2, 3]"],
        ["a lossy number", "[1000000000000000001]"],
      ])("rejects %s leaf", (_label, arg) => {
        expectRejected(withArg(arg), "actions[0].args[0]", "quote its numbers");
      });

      it("still rejects an array whose elements don't fit the type", () => {
        expectRejected(withArg('["not a number"]'), "actions[0].args[0]");
      });
    });
  });

  it("rejects an unknown action type", () => {
    expectRejected(parse({ type: "bridge" }), "actions[0].type");
  });
});
