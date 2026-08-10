import { PROPOSAL_JSON_PLACEHOLDER } from "@/features/create-proposal/constants";
import {
  formatImportIssue,
  parseProposalJson,
  type ParseProposalJsonResult,
} from "@/features/create-proposal/utils/parseProposalJson";

const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const CONTRACT = "0x3333333333333333333333333333333333333333";

const parse = (...actions: unknown[]) =>
  parseProposalJson(JSON.stringify({ actions }));

const reasons = (result: ParseProposalJsonResult) =>
  result.ok ? "" : result.issues.map(formatImportIssue).join("; ");

const expectOk = (result: ParseProposalJsonResult) => {
  if (!result.ok)
    throw new Error(`expected a valid document, got: ${reasons(result)}`);
  return result.value;
};

const expectRejected = (
  result: ParseProposalJsonResult,
  ...fragments: string[]
) => {
  if (result.ok) throw new Error("expected a rejection, got a valid document");
  const text = reasons(result);
  fragments.forEach((fragment) => expect(text).toContain(fragment));
  return text;
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

describe("parseProposalJson", () => {
  describe("the document", () => {
    describe("the format hint", () => {
      // MOD-8 supplies this text exactly, wrapping included, because the wrapping is
      // the point: it renders with `white-space: pre`.
      it("is the text the design specifies, wrapping included", () => {
        expect(PROPOSAL_JSON_PLACEHOLDER).toBe(
          `{
  "title": "Proposal title",
  "discussionUrl": "https://discuss...",
  "body": "## Synopsis\\n\\nMarkdown description.",
  "actions": [
    {"type": "eth-transfer", "recipient": "0x...", "amount": "600"},
    {"type": "erc20-transfer", "tokenAddress": "0x...",
     "recipient": "0x...", "amount": "480000"},
    {"type": "custom", "contractAddress": "0x...",
     "calldata": "0x..."}
  ]
}`,
        );
      });

      it("is valid JSON carrying the fields the parser reads", () => {
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
          "erc20-transfer",
          "custom",
        ]);
      });

      // MOD-8 describes its longest line as 66 characters; the text it supplies is 68.
      // The bound is here to catch a new line that overflows, not to relitigate these.
      it("stays inside the width it was wrapped for", () => {
        PROPOSAL_JSON_PLACEHOLDER.split("\n").forEach((line) => {
          expect(line.length).toBeLessThanOrEqual(68);
        });
      });
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
      ["a title that isn't text", '{"title":true}', "title:"],
    ])("rejects %s", (_label, input, fragment) => {
      expectRejected(parseProposalJson(input), fragment);
    });

    it("reads a numeric title as the digits it was written as", () => {
      expect(expectOk(parseProposalJson('{"title":42}'))).toMatchObject({
        title: "42",
      });
    });

    // Every issue, not the first three: the status row leads with the count, and a
    // capped list would make that count wrong on exactly the documents it matters on.
    it("reports every issue it found", () => {
      const error = expectRejected(
        parseProposalJson(
          JSON.stringify({
            title: true,
            body: true,
            discussionUrl: true,
            actions: true,
          }),
        ),
      );

      expect(error.split("; ")).toHaveLength(4);
    });

    it("rejects an unknown action type", () => {
      expectRejected(parse({ type: "bridge" }), "actions[0].type");
    });
  });

  describe("figures", () => {
    // Spliced as raw text, not TS numbers: the compiler rounds them exactly like
    // `JSON.parse` does, which is what eslint's no-loss-of-precision flags.
    it.each([
      ["a fraction beyond a double", "0.123456789123456789"],
      ["a fraction that collapses to an integer", "1.000000000000000001"],
      ["an integer past 2^53", "1000000000000000001"],
      ["a figure a double carries exactly", "1.5"],
    ])("keeps %s written unquoted, digit for digit", (_label, literal) => {
      expect(
        expectOk(
          parseProposalJson(
            `{"actions":[{"type":"eth-transfer","recipient":"vitalik.eth","amount":${literal}}]}`,
          ),
        ).actions?.[0],
      ).toMatchObject({ amount: literal });
    });

    it("takes the same figure quoted", () => {
      expect(
        expectOk(parse(eth({ amount: "0.123456789123456789" }))).actions?.[0],
      ).toMatchObject({ amount: "0.123456789123456789" });
    });

    it("still holds an unquoted figure to the form's own rule", () => {
      expectRejected(
        parseProposalJson(
          '{"actions":[{"type":"eth-transfer","recipient":"vitalik.eth","amount":0}]}',
        ),
        "actions[0].amount",
        "greater than 0",
      );
    });

    describe("inside a composite arg", () => {
      const withArg = (arg: unknown) =>
        parse(
          custom({
            abi: abiOf([{ name: "values", type: "uint256[]" }], "setMany"),
            functionName: "setMany",
            args: [arg],
          }),
        );

      it.each([
        ["null", [null], "actions[0].args[0][0]"],
        ["a boolean", [true], "actions[0].args[0][0]"],
        ["a nested object", [{ a: "1" }], "actions[0].args[0][0]"],
      ])("rejects %s leaf, at its own path", (_label, arg, path) => {
        expectRejected(withArg(arg), path);
      });

      it.each([
        ["a plain number", [1, 2, 3]],
        ["a number after quoted leaves", ["1", "2", 3]],
      ])("takes %s leaf, as the text it was written as", (_label, arg) => {
        expect(expectOk(withArg(arg)).actions?.[0]).toMatchObject({
          args: ['["1","2","3"]'],
        });
      });

      it("keeps a leaf whose digits a double can't hold", () => {
        const abi = JSON.stringify(
          abiOf([{ name: "values", type: "uint256[]" }], "setMany"),
        );
        expect(
          expectOk(
            parseProposalJson(
              `{"actions":[{"type":"custom","contractAddress":"${CONTRACT}","abi":${abi},"functionName":"setMany","args":[[1000000000000000001]]}]}`,
            ),
          ).actions?.[0],
        ).toMatchObject({ args: ['["1000000000000000001"]'] });
      });

      it("takes the same leaves quoted", () => {
        expect(expectOk(withArg(["1", "2", "3"])).actions?.[0]).toMatchObject({
          args: ['["1","2","3"]'],
        });
      });

      it("keeps a nested array nested", () => {
        const value = expectOk(
          parse(
            custom({
              abi: abiOf([{ name: "grid", type: "uint256[][]" }], "setGrid"),
              functionName: "setGrid",
              args: [[["1", "2"], ["3"]]],
            }),
          ),
        );
        expect(value.actions?.[0]).toMatchObject({
          args: ['[["1","2"],["3"]]'],
        });
      });
    });
  });

  describe("transfers", () => {
    it("accepts an ETH transfer", () => {
      expect(expectOk(parse(eth())).actions).toEqual([
        { type: "eth-transfer", recipient: "vitalik.eth", amount: "1.5" },
      ]);
    });

    it("leaves an omitted decimals undefined rather than guessing", () => {
      expect(expectOk(parse(erc20())).actions?.[0]).not.toHaveProperty(
        "decimals",
      );
    });

    it("rejects a token address that isn't an address", () => {
      expectRejected(
        parse(erc20({ tokenAddress: "usdc.eth" })),
        "actions[0].tokenAddress",
      );
    });
  });

  describe("custom actions", () => {
    it("fills the unused fields of a calldata-only action", () => {
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

    it("stores a bare function name as the full signature", () => {
      const value = expectOk(
        parse(
          custom({
            abi: abiOf([{ name: "value", type: "uint256" }], "setValue"),
            functionName: "setValue",
            args: ["1"],
          }),
        ),
      );

      expect(value.actions?.[0]).toMatchObject({
        functionName: "setValue(uint256)",
      });
    });

    it("stores args exactly as pasted", () => {
      const value = expectOk(
        parse(
          custom({
            abi: abiOf([{ name: "flag", type: "bool" }], "setFlag"),
            functionName: "setFlag",
            args: [" true "],
          }),
        ),
      );

      expect(value.actions?.[0]).toMatchObject({ args: [" true "] });
    });

    it("rejects an abi that isn't an array", () => {
      expectRejected(
        parse(custom({ abi: "not an abi", functionName: "f" })),
        "actions[0].abi",
      );
    });

    it.each([
      ["a wei amount", "1000000000000000000"],
      ["zero", "0"],
    ])("refuses %s in value", (_label, value) => {
      expectRejected(
        parse(custom({ calldata: "0xa9059cbb", value })),
        "actions[0].value",
        "isn't supported yet",
      );
    });
  });

  /* Each of these used to pass the import and turn up on the creation page instead,
   * as a Publish button that would not enable. They are caught here now not because
   * the import restates them, but because `ProposalActionSchema` owns them. */
  describe("the form's rules, in the dialog", () => {
    const setValueAbi = abiOf([{ name: "value", type: "uint256" }], "setValue");

    it.each([
      [
        "a function that isn't in the abi",
        custom({ abi: setValueAbi, functionName: "mystery", args: [] }),
        "is not a function in this ABI",
      ],
      [
        "a function name with no abi to resolve it",
        custom({ functionName: "setValue", args: ["1"] }),
        "Required when a function name is used",
      ],
      [
        "raw calldata and a function name at once",
        custom({
          abi: setValueAbi,
          functionName: "setValue",
          args: ["1"],
          calldata: "0xa9059cbb",
        }),
        "Can't be combined with a function name",
      ],
      [
        "the wrong number of args for the signature",
        custom({
          abi: setValueAbi,
          functionName: "setValue",
          args: ["1", "2"],
        }),
        "takes 1, got 2",
      ],
      [
        "a read-only function",
        custom({
          abi: [
            {
              type: "function",
              name: "peek",
              stateMutability: "view",
              inputs: [],
              outputs: [],
            },
          ],
          functionName: "peek",
          args: [],
        }),
        "only reads state",
      ],
      [
        "a contract address that is neither an address nor an ENS name",
        custom({ contractAddress: "not-an-address", calldata: "0x00" }),
        "Must be a valid address or ENS name",
      ],
      [
        "an arg its declared type can't hold",
        custom({ abi: setValueAbi, functionName: "setValue", args: ["nope"] }),
        "Must be a non-negative integer",
      ],
    ])("rejects %s", (_label, action, fragment) => {
      expectRejected(parse(action), fragment);
    });

    it.each([
      ["a recipient that is neither an address nor an ENS name", "not-a-name"],
      ["an empty recipient", ""],
    ])("rejects a transfer with %s", (_label, recipient) => {
      expectRejected(parse(eth({ recipient })), "actions[0].recipient");
    });

    it("rejects an ETH amount finer than 18 decimals", () => {
      expectRejected(
        parse(eth({ amount: `0.${"0".repeat(18)}1` })),
        "actions[0].amount",
        "more decimal places",
      );
    });
  });

  describe("tuple args", () => {
    const durations = {
      name: "durations",
      type: "tuple",
      components: [
        { name: "cliff", type: "uint256" },
        { name: "total", type: "uint256" },
      ],
    };

    const stream = (args: unknown[]) =>
      parse(
        custom({
          abi: abiOf([durations], "createStream"),
          functionName: "createStream",
          args,
        }),
      );

    it("takes a tuple keyed by component name", () => {
      expect(
        expectOk(stream([{ cliff: "100", total: "500" }])).actions?.[0],
      ).toMatchObject({ args: ['["100","500"]'] });
    });

    it("takes the same tuple as an array in component order", () => {
      expect(expectOk(stream([["100", "500"]])).actions?.[0]).toMatchObject({
        args: ['["100","500"]'],
      });
    });

    it("reorders a keyed tuple into component order", () => {
      expect(
        expectOk(stream([{ total: "500", cliff: "100" }])).actions?.[0],
      ).toMatchObject({ args: ['["100","500"]'] });
    });

    it("names the field that is missing", () => {
      expectRejected(
        stream([{ cliff: "100" }]),
        "actions[0].args[0].total: Required",
      );
    });

    it("names a field the tuple doesn't declare", () => {
      expectRejected(
        stream([{ cliff: "100", total: "500", bonus: "1" }]),
        "actions[0].args[0].bonus",
      );
    });

    it("rejects a tuple given the wrong number of positional fields", () => {
      expectRejected(stream([["100", "500", "900"]]), "actions[0].args[0]");
    });

    // VAL-6, verbatim: an imprecise path cost about a week of back-and-forth on a
    // document that was already correct.
    it("points inside a nested tuple, not at the argument", () => {
      const nested = {
        name: "schedule",
        type: "tuple",
        components: [{ ...durations }],
      };
      const text = expectRejected(
        parse(
          custom({
            abi: abiOf([nested], "createStream"),
            functionName: "createStream",
            args: [{ durations: { cliff: "1", total: null } }],
          }),
        ),
      );
      expect(text).toContain("actions[0].args[0].durations.total");
    });

    it("takes a real boolean where the abi declares bool", () => {
      const value = expectOk(
        parse(
          custom({
            abi: abiOf([{ name: "on", type: "bool" }], "setOn"),
            functionName: "setOn",
            args: [true],
          }),
        ),
      );
      expect(value.actions?.[0]).toMatchObject({ args: ["true"] });
    });

    it("refuses a keyed tuple it has no abi to order", () => {
      expectRejected(
        parse(custom({ functionName: "mystery", args: [{ cliff: "1" }] })),
        "actions[0].args[0]",
      );
    });
  });

  describe("locating a problem in the text", () => {
    const document = `{
  "title": "Proposal title",
  "actions": [
    {"type": "eth-transfer", "recipient": "vitalik.eth", "amount": "600"},
    {"type": "erc20-transfer",
     "recipient": "vitalik.eth",
     "tokenAddress": "${USDC}",
     "amount": -480000}
  ]
}`;

    it("reports the line the offending value was written on", () => {
      const result = parseProposalJson(document);
      if (result.ok) throw new Error("expected a rejection");
      expect(result.issues[0]).toMatchObject({
        path: ["actions", 1, "amount"],
        line: 8,
      });
    });

    it("counts from the start of what was pasted, blank lines included", () => {
      const result = parseProposalJson(`\n\n${document}`);
      if (result.ok) throw new Error("expected a rejection");
      expect(result.issues[0].line).toBe(10);
    });

    it("reports a line for a document that isn't JSON at all", () => {
      const result = parseProposalJson('{\n  "title": "x",\n  "body" nope\n}');
      if (result.ok) throw new Error("expected a rejection");
      expect(result.issues[0].line).toBe(3);
    });
  });
});
