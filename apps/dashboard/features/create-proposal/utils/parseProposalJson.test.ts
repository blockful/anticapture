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

    // Left undecided here on purpose: resolveImportedDecimals settles it
    // against the token contract, since a pasted value would silently rescale
    // the transfer.
    it("leaves an omitted decimals undefined rather than guessing", () => {
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

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.actions?.[0]).not.toHaveProperty("decimals");
    });

    it("rejects a token address that isn't an address", () => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "erc20-transfer",
              recipient: "vitalik.eth",
              // The form requires a concrete address here, and the decimals
              // lookup needs one too.
              tokenAddress: "usdc.eth",
              amount: "1",
              decimals: 6,
            },
          ],
        }),
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("actions[0].tokenAddress");
    });

    // Everything below would otherwise clear the import and then fail
    // ProposalFormSchema, which leaves Publish disabled with no visible reason:
    // action rows render no field errors.
    it.each([
      ["a recipient that is neither address nor ENS", { recipient: "banana" }],
      ["an amount that isn't a number", { amount: "a lot" }],
      ["a zero amount", { amount: "0" }],
      ["a negative amount", { amount: "-1" }],
    ])("rejects %s", (_label, overrides) => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "eth-transfer",
              recipient: "vitalik.eth",
              amount: "1.5",
              ...overrides,
            },
          ],
        }),
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("actions[0]");
    });

    it("rejects a contract address that is neither address nor ENS", () => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "custom",
              contractAddress: "not-a-contract",
              calldata: "0xa9059cbb",
            },
          ],
        }),
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("actions[0].contractAddress");
    });

    it("accepts a hex value, which BigInt() handles", () => {
      const result = parseProposalJson(
        JSON.stringify({
          actions: [
            {
              type: "custom",
              contractAddress: "0x3333333333333333333333333333333333333333",
              calldata: "0xa9059cbb",
              value: "0xde0b6b3a7640000",
            },
          ],
        }),
      );

      expect(result.ok).toBe(true);
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

      // parseAbiStrict only guarantees a string `type`, so these survive it and
      // used to reach viem's formatter, which throws and takes the whole import
      // dialog down instead of showing a paste error.
      it.each([
        ["no name", { type: "function", inputs: [], outputs: [] }],
        ["no inputs", { type: "function", name: "setValue", outputs: [] }],
        [
          "a non-string name",
          { type: "function", name: 42, inputs: [], outputs: [] },
        ],
      ])(
        "reports an abi function entry with %s instead of throwing",
        (_label, malformed) => {
          const run = () =>
            parseProposalJson(
              JSON.stringify({
                actions: [
                  {
                    type: "custom",
                    contractAddress:
                      "0x3333333333333333333333333333333333333333",
                    abi: [...setValueAbi, malformed],
                    functionName: "setValue(address,uint256)",
                    args: ["vitalik.eth", "1"],
                  },
                ],
              }),
            );

          expect(run).not.toThrow();
          const result = run();
          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error).toContain("actions[0].abi");
        },
      );

      // JSON.parse has already rounded these by the time the schema sees them,
      // so the rounded value looks like a perfectly good integer.
      it("rejects an arg past the precision of a JSON number", () => {
        const result = parseProposalJson(
          `{"actions":[{"type":"custom","contractAddress":"0x3333333333333333333333333333333333333333","abi":${JSON.stringify(setValueAbi)},"functionName":"setValue(address,uint256)","args":["vitalik.eth",1000000000000000001]}]}`,
        );

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toContain("actions[0].args[1]");
        expect(result.error).toContain("precision");
      });

      it("takes the same figure quoted, which survives JSON.parse intact", () => {
        const result = parseProposalJson(
          `{"actions":[{"type":"custom","contractAddress":"0x3333333333333333333333333333333333333333","abi":${JSON.stringify(setValueAbi)},"functionName":"setValue(address,uint256)","args":["vitalik.eth","1000000000000000001"]}]}`,
        );

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.value.actions?.[0]).toMatchObject({
          args: ["vitalik.eth", "1000000000000000001"],
        });
      });

      // parseArrayType calls .match on the type, so a bare {} used to throw a
      // TypeError straight out of safeParse.
      it("reports an abi input with no type instead of throwing", () => {
        const run = () =>
          parseProposalJson(
            JSON.stringify({
              actions: [
                {
                  type: "custom",
                  contractAddress: "0x3333333333333333333333333333333333333333",
                  abi: [
                    {
                      type: "function",
                      name: "mystery",
                      stateMutability: "nonpayable",
                      inputs: [{}],
                      outputs: [],
                    },
                  ],
                  // The bare name skips the signature formatter, which is where
                  // the guard used to sit.
                  functionName: "mystery",
                  args: ["1"],
                },
              ],
            }),
          );

        expect(run).not.toThrow();
        const result = run();
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toContain("actions[0].abi");
      });

      describe("composite args", () => {
        const arrayAbi = [
          {
            type: "function",
            name: "setMany",
            stateMutability: "nonpayable",
            inputs: [{ name: "values", type: "uint256[]" }],
            outputs: [],
          },
        ];

        const withArgs = (args: unknown[]) =>
          parseProposalJson(
            JSON.stringify({
              actions: [
                {
                  type: "custom",
                  contractAddress: "0x3333333333333333333333333333333333333333",
                  abi: arrayAbi,
                  functionName: "setMany(uint256[])",
                  args,
                },
              ],
            }),
          );

        it("accepts a JSON array string", () => {
          expect(withArgs(["[1, 2, 3]"]).ok).toBe(true);
        });

        // storageToArg swallows the parse error and hands back an empty array,
        // which isArgComplete calls complete; encodeActions then re-parses the
        // original text at publish and throws.
        it("rejects a composite arg that isn't JSON", () => {
          const result = withArgs(["not json"]);

          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error).toContain("actions[0].args[0]");
          expect(result.error).toContain("must be a JSON array");
        });

        it("rejects a composite arg that is JSON but not an array", () => {
          const result = withArgs(['{"nope":1}']);

          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error).toContain("must be a JSON array");
        });

        // Same rounding as a bare numeric arg, one level down: JSON.parse
        // flattens the leaf before anything inspects it, and publish re-parses
        // the original text and encodes the rounded figure.
        it("rejects an unsafe number nested inside the array", () => {
          const result = withArgs(["[1000000000000000001]"]);

          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error).toContain("actions[0].args[0]");
          expect(result.error).toContain("precision");
        });

        it("takes the same figure quoted inside the array", () => {
          expect(withArgs(['["1000000000000000001"]']).ok).toBe(true);
        });

        it("still rejects an array whose elements don't fit the type", () => {
          const result = withArgs(['["not a number"]']);

          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error).toContain("actions[0].args[0]");
        });
      });

      // encodeActions throws on a tuple whose components are missing, so the
      // ABI has to declare them for the action to be encodable at all.
      it.each([
        ["a bare tuple", "tuple"],
        ["a tuple array", "tuple[]"],
      ])("rejects %s input with no components", (_label, type) => {
        const run = () =>
          parseProposalJson(
            JSON.stringify({
              actions: [
                {
                  type: "custom",
                  contractAddress: "0x3333333333333333333333333333333333333333",
                  abi: [
                    {
                      type: "function",
                      name: "setStruct",
                      stateMutability: "nonpayable",
                      inputs: [{ name: "data", type }],
                      outputs: [],
                    },
                  ],
                  // Bare name again: the signature formatter is bypassed.
                  functionName: "setStruct",
                  args: ["[]"],
                },
              ],
            }),
          );

        expect(run).not.toThrow();
        const result = run();
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toContain("actions[0].abi");
      });

      it("accepts a tuple input that declares its components", () => {
        const result = parseProposalJson(
          JSON.stringify({
            actions: [
              {
                type: "custom",
                contractAddress: "0x3333333333333333333333333333333333333333",
                abi: [
                  {
                    type: "function",
                    name: "setStruct",
                    stateMutability: "nonpayable",
                    inputs: [
                      {
                        name: "data",
                        type: "tuple",
                        components: [
                          { name: "who", type: "address" },
                          { name: "value", type: "uint256" },
                        ],
                      },
                    ],
                    outputs: [],
                  },
                ],
                functionName: "setStruct",
                args: ['["vitalik.eth", "1"]'],
              },
            ],
          }),
        );

        expect(result.ok).toBe(true);
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
