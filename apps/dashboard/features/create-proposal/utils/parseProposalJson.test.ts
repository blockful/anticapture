import { PROPOSAL_JSON_PLACEHOLDER } from "@/features/create-proposal/constants";
import {
  formatImportIssue,
  parseProposalJson,
  type ParseProposalJsonResult,
} from "@/features/create-proposal/utils/parseProposalJson";

/*
 * Whether an action is publishable is ProposalFormSchema's business, covered by
 * validateCustomAction.test. What's tested here is what reading a document can
 * get wrong: JSON's lossiness with numbers, an ETH value the form can't show,
 * and decimals only the token contract can settle.
 */

const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const CONTRACT = "0x3333333333333333333333333333333333333333";

const parse = (...actions: unknown[]) =>
  parseProposalJson(JSON.stringify({ actions }));

/** Every issue on one line, the way a reviewer reads them. */
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
    /*
     * A shape hint, not a document: it puts "0x..." where real values go. The
     * import dialog opens with it already in the field, so it is the first thing
     * an author sees about the format and the thing they edit into a real
     * proposal. A typo in it teaches the wrong shape silently.
     */
    describe("the format hint", () => {
      // MOD-8 supplies this text exactly, wrapping included, because the wrapping
      // is the point: it renders with `white-space: pre`, so the line breaks are
      // the author's and not the browser's.
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

      // MOD-8 describes its longest line as 66 characters; the text it supplies is
      // 68 at the eth-transfer line, and the text is what ships. The bound is here
      // to catch a new line that overflows, not to relitigate the existing ones.
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
      ["a wrongly typed title", '{"title":42}', "title:"],
    ])("rejects %s", (_label, input, fragment) => {
      expectRejected(parseProposalJson(input), fragment);
    });

    // Every issue, not the first three. The status row leads with the count
    // ("3 problems · first on line 7"), and a capped list would have made that
    // count wrong for exactly the documents it matters on.
    it("reports every issue it found", () => {
      const error = expectRejected(
        parseProposalJson(
          JSON.stringify({ title: 1, body: 2, discussionUrl: 3, actions: 4 }),
        ),
      );

      expect(error.split("; ")).toHaveLength(4);
    });

    it("rejects an unknown action type", () => {
      expectRejected(parse({ type: "bridge" }), "actions[0].type");
    });
  });

  describe("figures", () => {
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

    // A composite arg is written as JSON, so the quoting rule applies to every
    // leaf inside it for the same reason it applies at the top level.
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
        ["a plain number", [1, 2, 3], "actions[0].args[0][0]"],
        ["null", [null], "actions[0].args[0][0]"],
        ["a boolean", [true], "actions[0].args[0][0]"],
        ["a nested object", [{ a: "1" }], "actions[0].args[0][0]"],
        // Only the offending leaf is named, not the whole argument.
        ["a number after good leaves", ["1", "2", 3], "actions[0].args[0][2]"],
      ])("rejects %s leaf, at its own path", (_label, arg, path) => {
        expectRejected(withArg(arg), path);
      });

      // Spliced as raw text, like the top-level figures above: written as a TS
      // literal the compiler rounds it before the test can pass it in.
      it("rejects a leaf whose digits a double can't hold", () => {
        const abi = JSON.stringify(
          abiOf([{ name: "values", type: "uint256[]" }], "setMany"),
        );
        expectRejected(
          parseProposalJson(
            `{"actions":[{"type":"custom","contractAddress":"${CONTRACT}","abi":${abi},"functionName":"setMany","args":[[1000000000000000001]]}]}`,
          ),
          "actions[0].args[0][0]",
          "quoted",
        );
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

    // Left undecided here on purpose: resolveImportedDecimals settles it
    // against the token contract, since a pasted value would silently rescale
    // the transfer.
    it("leaves an omitted decimals undefined rather than guessing", () => {
      expect(expectOk(parse(erc20())).actions?.[0]).not.toHaveProperty(
        "decimals",
      );
    });

    // Stricter than the other addresses because this one is called, not just
    // stored: the decimals lookup has nothing to read from an ENS name.
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

    // Accepted the way the encoder accepts it, but stored normalized: the edit
    // modal matches its select on full signatures only, so a bare name would
    // leave the imported row unable to hydrate.
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

    // Normalizing scalar text is argTree's job, on the way to the encoder, so a
    // second opinion here would be one more thing to keep in step.
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

    // Nothing in the form shows or edits an ETH value, so importing one leaves
    // funds on a call the author can't review. Refused by name rather than
    // stripped as an unknown key: dropping a declared value quietly would
    // publish 0 wei instead of what the document asked for.
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

  /*
   * A tuple is unavoidable in real governance calls (Sablier streams, Governor
   * `propose`, most Safe module functions), so the document has to be able to
   * express one, in either shape JSON offers for it: an object keyed by component
   * name, or an array in component order.
   *
   * The form stores tuples positionally, so the keyed form is reordered here.
   * That reordering is the only reason this conversion needs the ABI.
   */
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
      // Written back to front on purpose: the stored form must still be
      // cliff-then-total, because that is what the encoder maps.
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

    // The encoder maps components only, so an extra field is dropped on the way
    // to the calldata and the proposal sends something narrower than intended.
    it("names a field the tuple doesn't declare", () => {
      expectRejected(
        stream([{ cliff: "100", total: "500", bonus: "1" }]),
        "actions[0].args[0].bonus",
      );
    });

    it("rejects a tuple given the wrong number of positional fields", () => {
      expectRejected(stream([["100", "500", "900"]]), "actions[0].args[0]");
    });

    // VAL-6, verbatim: an imprecise path cost about a week of back-and-forth on
    // a document that was already correct.
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
            args: [{ durations: { cliff: "1", total: 2 } }],
          }),
        ),
      );
      expect(text).toContain("actions[0].args[0].durations.total");
      expect(text).toContain("must be quoted");
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

  /*
   * Line numbers and the literal as written. Both are gone after JSON.parse, and
   * both are what makes "Line 7 · unquoted number 480000 must be quoted" say
   * anything at all.
   */
  describe("locating a problem in the text", () => {
    const document = `{
  "title": "Proposal title",
  "actions": [
    {"type": "eth-transfer", "recipient": "vitalik.eth", "amount": "600"},
    {"type": "erc20-transfer",
     "recipient": "vitalik.eth",
     "tokenAddress": "${USDC}",
     "amount": 480000}
  ]
}`;

    it("reports the line the figure was written on", () => {
      const result = parseProposalJson(document);
      if (result.ok) throw new Error("expected a rejection");
      expect(result.issues[0]).toMatchObject({
        line: 8,
        numberLiteral: "480000",
      });
    });

    it("keeps digits the parsed double already lost", () => {
      const result = parseProposalJson(
        '{"actions":[{"type":"eth-transfer","recipient":"vitalik.eth","amount":1000000000000000000001}]}',
      );
      if (result.ok) throw new Error("expected a rejection");
      expect(result.issues[0].numberLiteral).toBe("1000000000000000000001");
    });

    it("counts from the start of what was pasted, blank lines included", () => {
      const result = parseProposalJson(`\n\n${document}`);
      if (result.ok) throw new Error("expected a rejection");
      expect(result.issues[0].line).toBe(10);
    });
  });
});
