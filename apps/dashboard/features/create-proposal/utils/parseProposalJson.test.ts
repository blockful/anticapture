import { PROPOSAL_JSON_PLACEHOLDER } from "@/features/create-proposal/constants";
import { parseProposalJson } from "@/features/create-proposal/utils/parseProposalJson";

describe("parseProposalJson", () => {
  // The modal placeholder is a shape hint, not a document: it puts "0x…" where
  // real values go, so it can't be parsed. Guard its structure instead, so a
  // typo there can't quietly teach the wrong format.
  it("shows a hint whose shape matches what the parser reads", () => {
    const hint = JSON.parse(PROPOSAL_JSON_PLACEHOLDER) as {
      actions: { type: string }[];
    };

    expect(Object.keys(hint)).toEqual([
      "title",
      "discussionUrl",
      "body",
      "actions",
    ]);
    expect(hint.actions.map((action) => action.type)).toEqual([
      "eth-transfer",
      "custom",
    ]);
  });

  it("fills only the fields the document carries", () => {
    const result = parseProposalJson('{"title":"Only a title"}');

    expect(result).toEqual({
      ok: true,
      value: {
        title: "Only a title",
        discussionUrl: undefined,
        body: undefined,
        actions: undefined,
      },
    });
  });

  it("ignores keys it doesn't know, so a saved draft pastes in as-is", () => {
    const result = parseProposalJson(
      JSON.stringify({
        id: "draft-1",
        daoId: "ens",
        createdAt: 1234,
        title: "From a draft",
        body: "Body",
        actions: [],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      title: "From a draft",
      discussionUrl: undefined,
      body: "Body",
      actions: [],
    });
  });

  describe("actions", () => {
    it("accepts an ETH transfer and stringifies a numeric amount", () => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "eth-transfer",
              recipient: "0x1111111111111111111111111111111111111111",
              amount: 1.5,
            },
          ],
        }),
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.actions).toEqual([
        {
          type: "eth-transfer",
          recipient: "0x1111111111111111111111111111111111111111",
          amount: "1.5",
        },
      ]);
    });

    it("requires decimals on an ERC-20 transfer", () => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "erc20-transfer",
              recipient: "vitalik.eth",
              tokenAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              amount: "25000",
            },
          ],
        }),
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("actions[0].decimals");
    });

    it("normalizes a custom action's optional fields", () => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "custom",
              contractAddress: "0x2222222222222222222222222222222222222222",
              abi: [
                {
                  type: "function",
                  name: "setValue",
                  stateMutability: "nonpayable",
                  inputs: [{ name: "value", type: "uint256" }],
                  outputs: [],
                },
              ],
              functionName: "setValue(uint256)",
              args: [42],
            },
          ],
        }),
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const [action] = result.value.actions ?? [];
      expect(action).toMatchObject({
        type: "custom",
        contractAddress: "0x2222222222222222222222222222222222222222",
        functionName: "setValue(uint256)",
        args: ["42"],
      });
      expect(action).not.toHaveProperty("calldata");
    });

    it("accepts a calldata-only custom action", () => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "custom",
              contractAddress: "0x3333333333333333333333333333333333333333",
              calldata: "0xa9059cbb",
            },
          ],
        }),
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.actions).toEqual([
        {
          type: "custom",
          contractAddress: "0x3333333333333333333333333333333333333333",
          abi: [],
          functionName: "",
          args: [],
          calldata: "0xa9059cbb",
        },
      ]);
    });

    it.each([
      ["a function signature", "transfer(address,uint256)"],
      ["a non-hex string", "not calldata"],
      ["hex without the 0x prefix", "a9059cbb"],
      ["an odd number of characters", "0xa9059cb"],
    ])("rejects calldata that is %s", (_label, calldata) => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "custom",
              contractAddress: "0x3333333333333333333333333333333333333333",
              calldata,
            },
          ],
        }),
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("actions[0].calldata");
    });

    it("accepts a bare 0x, the empty-calldata form viem produces", () => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "custom",
              contractAddress: "0x3333333333333333333333333333333333333333",
              calldata: "0x",
            },
          ],
        }),
      );

      expect(result.ok).toBe(true);
    });

    it("rejects a value that BigInt() would throw on", () => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "custom",
              contractAddress: "0x3333333333333333333333333333333333333333",
              calldata: "0xa9059cbb",
              value: "1e18",
            },
          ],
        }),
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("actions[0].value");
    });

    it("accepts an integer value in wei", () => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "custom",
              contractAddress: "0x3333333333333333333333333333333333333333",
              calldata: "0xa9059cbb",
              value: "1000000000000000000",
            },
          ],
        }),
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.actions?.[0]).toMatchObject({
        value: "1000000000000000000",
      });
    });

    it("rejects a custom action with neither functionName nor calldata", () => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "custom",
              contractAddress: "0x3333333333333333333333333333333333333333",
            },
          ],
        }),
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("functionName");
    });

    describe("abi-backed calls", () => {
      const setValueAbi = [
        {
          type: "function",
          name: "setValue",
          stateMutability: "nonpayable",
          inputs: [
            { name: "who", type: "address" },
            { name: "value", type: "uint256" },
          ],
          outputs: [],
        },
      ];

      const customAction = (overrides: Record<string, unknown>) =>
        JSON.stringify({
          actions: [
            {
              type: "custom",
              contractAddress: "0x3333333333333333333333333333333333333333",
              abi: setValueAbi,
              ...overrides,
            },
          ],
        });

      it("accepts a call whose function and args line up", () => {
        const result = parseProposalJson(
          customAction({
            functionName: "setValue(address,uint256)",
            args: ["vitalik.eth", 42],
          }),
        );

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.value.actions?.[0]).toMatchObject({
          functionName: "setValue(address,uint256)",
          args: ["vitalik.eth", "42"],
        });
      });

      it("accepts the bare function name, like encodeActions does", () => {
        const result = parseProposalJson(
          customAction({
            functionName: "setValue",
            args: ["0x1111111111111111111111111111111111111111", "1"],
          }),
        );

        expect(result.ok).toBe(true);
      });

      it("rejects a function that isn't in the abi", () => {
        const result = parseProposalJson(
          customAction({ functionName: "missing()", args: [] }),
        );

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toContain("actions[0].functionName");
        expect(result.error).toContain("missing()");
      });

      it("rejects too few args for the function", () => {
        const result = parseProposalJson(
          customAction({ functionName: "setValue(address,uint256)", args: [] }),
        );

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toContain("actions[0].args");
        expect(result.error).toContain("takes 2, got 0");
      });

      it("rejects omitted args entirely", () => {
        const result = parseProposalJson(
          customAction({ functionName: "setValue(address,uint256)" }),
        );

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toContain("takes 2, got 0");
      });

      it("rejects too many args", () => {
        const result = parseProposalJson(
          customAction({
            functionName: "setValue(address,uint256)",
            args: ["0x1111111111111111111111111111111111111111", "1", "2"],
          }),
        );

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toContain("takes 2, got 3");
      });

      it("rejects an arg that doesn't fit its solidity type", () => {
        const result = parseProposalJson(
          customAction({
            functionName: "setValue(address,uint256)",
            args: ["not-an-address", "1"],
          }),
        );

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toContain("actions[0].args[0]");
        expect(result.error).toContain("address");
      });

      it("rejects a blank arg", () => {
        const result = parseProposalJson(
          customAction({
            functionName: "setValue(address,uint256)",
            args: ["0x1111111111111111111111111111111111111111", "  "],
          }),
        );

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toContain("actions[0].args[1]");
      });

      it("skips the abi checks when raw calldata is supplied", () => {
        const result = parseProposalJson(
          customAction({ functionName: "missing()", calldata: "0xa9059cbb" }),
        );

        expect(result.ok).toBe(true);
      });
    });

    it("rejects a functionName without an abi to encode it against", () => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "custom",
              contractAddress: "0x3333333333333333333333333333333333333333",
              functionName: "setValue(uint256)",
              args: ["1"],
            },
          ],
        }),
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("actions[0].abi");
    });

    it("rejects a malformed abi", () => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "custom",
              contractAddress: "0x3333333333333333333333333333333333333333",
              abi: "not an abi",
              functionName: "setValue(uint256)",
            },
          ],
        }),
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("actions[0].abi");
    });

    it("rejects an unknown action type", () => {
      const result = parseProposalJson(
        JSON.stringify({ actions: [{ type: "bridge" }] }),
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("actions[0].type");
    });
  });

  describe("rejections", () => {
    it("rejects an empty paste", () => {
      expect(parseProposalJson("   ")).toEqual({
        ok: false,
        error: "Paste the proposal JSON first.",
      });
    });

    it("rejects text that isn't JSON", () => {
      const result = parseProposalJson("{ title: nope }");

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("valid JSON");
    });

    it("rejects a top-level array", () => {
      const result = parseProposalJson("[]");

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("Expected a JSON object");
    });

    it("rejects an object with no known field", () => {
      const result = parseProposalJson('{"foo":"bar"}');

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("No known fields found");
    });

    it("rejects a wrongly typed title", () => {
      const result = parseProposalJson('{"title":42}');

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("title:");
    });

    it("reports at most three issues", () => {
      const result = parseProposalJson(
        JSON.stringify({ title: 1, body: 2, discussionUrl: 3, actions: 4 }),
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.split("; ")).toHaveLength(3);
    });
  });
});
