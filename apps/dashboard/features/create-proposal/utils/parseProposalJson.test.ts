import { PROPOSAL_JSON_PLACEHOLDER } from "@/features/create-proposal/constants";
import {
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

    // The composite is JSON too, so an unquoted leaf is already rewritten
    // before anything can inspect it, exactly as at the top level.
    describe("inside a composite arg", () => {
      const withArg = (arg: string) =>
        parse(
          custom({
            abi: abiOf([{ name: "values", type: "uint256[]" }], "setMany"),
            functionName: "setMany",
            args: [arg],
          }),
        );

      it.each([
        ["a plain number", "[1, 2, 3]"],
        ["a lossy number", "[1000000000000000001]"],
      ])("rejects %s leaf", (_label, arg) => {
        expectRejected(withArg(arg), "actions[0].args[0]", "quote its numbers");
      });

      it("takes the same leaves quoted", () => {
        expectOk(withArg('["1", "2", "3"]'));
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
});
