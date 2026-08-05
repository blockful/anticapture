import { type AbiFunction, type Hex } from "viem";

import { encodeFunctionData } from "viem";

import {
  buildEmpty,
  parseArrayType,
  storageToArg,
  storageToArgForDisplay,
  argToStorage,
  argsToTrees,
  treesToArgs,
  treesToEncodeValues,
  decodeCalldataToArgs,
  type ArgValue,
} from "@/features/create-proposal/utils/argTree";
import { encodeActions } from "@/features/create-proposal/utils/encodeActions";
import type { CustomAction } from "@/features/create-proposal/types";

const identityResolver = async (v: string) => v as `0x${string}`;

const ADDR_A = "0x1111111111111111111111111111111111111111";
const ADDR_B = "0x2222222222222222222222222222222222222222";

// Re-parse composite JSON so comparisons ignore incidental whitespace and the
// number-vs-string representation of scalar leaves.
const normalize = (stored: string): unknown => {
  const t = stored.trim();
  if (t.startsWith("[") || t.startsWith("{")) {
    const deepStringify = (v: unknown): unknown =>
      Array.isArray(v) ? v.map(deepStringify) : String(v);
    return deepStringify(JSON.parse(t));
  }
  return stored;
};

describe("parseArrayType", () => {
  it("detects dynamic, fixed, and non-array types", () => {
    expect(parseArrayType("uint256[]")).toEqual({
      elementType: "uint256",
      length: null,
    });
    expect(parseArrayType("uint8[3]")).toEqual({
      elementType: "uint8",
      length: 3,
    });
    expect(parseArrayType("uint256[][]")).toEqual({
      elementType: "uint256[]",
      length: null,
    });
    expect(parseArrayType("uint256")).toBeNull();
    expect(parseArrayType("tuple")).toBeNull();
  });
});

describe("buildEmpty", () => {
  it("creates empty leaves/containers per type", () => {
    expect(buildEmpty({ type: "uint256" })).toBe("");
    expect(buildEmpty({ type: "address" })).toBe("");
    expect(buildEmpty({ type: "uint256[]" })).toEqual([]);
    expect(buildEmpty({ type: "uint8[2]" })).toEqual(["", ""]);
    expect(
      buildEmpty({
        type: "tuple",
        components: [{ type: "uint256" }, { type: "address" }],
      }),
    ).toEqual(["", ""]);
    expect(
      buildEmpty({
        type: "tuple[]",
        components: [{ type: "uint256" }],
      }),
    ).toEqual([]);
  });
});

describe("storage <-> tree round-trip", () => {
  const cases: {
    name: string;
    type: string;
    components?: unknown;
    stored: string;
  }[] = [
    { name: "uint256", type: "uint256", stored: "100" },
    { name: "bool", type: "bool", stored: "true" },
    { name: "address", type: "address", stored: ADDR_A },
    {
      name: "bytes32",
      type: "bytes32",
      stored:
        "0x0000000000000000000000000000000000000000000000000000000000000001",
    },
    { name: "string", type: "string", stored: "hello world" },
    { name: "dynamic array", type: "uint256[]", stored: '["1","2","3"]' },
    { name: "empty dynamic array", type: "uint256[]", stored: "[]" },
    { name: "fixed array", type: "uint8[2]", stored: '["1","2"]' },
    {
      name: "multidim array",
      type: "uint256[][]",
      stored: '[["1"],["2","3"]]',
    },
    {
      name: "tuple",
      type: "tuple",
      components: [{ type: "uint256" }, { type: "address" }],
      stored: `["1","${ADDR_A}"]`,
    },
    {
      name: "tuple[] (array of structs)",
      type: "tuple[]",
      components: [{ type: "uint256" }, { type: "bool" }],
      stored: '[["1","true"],["2","false"]]',
    },
    {
      name: "struct of arrays",
      type: "tuple",
      components: [{ type: "uint256[]" }, { type: "address" }],
      stored: `[["1","2"],"${ADDR_A}"]`,
    },
  ];

  it.each(cases)("round-trips $name", ({ type, components, stored }) => {
    const param = { type, ...(components ? { components } : {}) } as never;
    const tree = storageToArg(param, stored);
    const back = argToStorage(param, tree);
    expect(normalize(back)).toEqual(normalize(stored));
  });

  it("coerces scalar leaves to strings when parsing numeric JSON (legacy drafts)", () => {
    const tree = storageToArg({ type: "uint256[]" } as never, "[1, 2, 3]");
    expect(tree).toEqual(["1", "2", "3"]);
  });

  // The display conversion is the one that forgives, so it is the one asked
  // here. `storageToArg` itself refuses, which is covered below.
  it("falls back to empty container for malformed composite storage", () => {
    expect(
      storageToArgForDisplay({ type: "uint256[]" } as never, "not json"),
    ).toEqual([]);
  });

  it("refuses that same malformed storage when the answer will be encoded", () => {
    expect(() =>
      storageToArg({ type: "uint256[]" } as never, "not json"),
    ).toThrow();
  });

  // A tuple short of its components is malformed like any other, so the display
  // conversion degrades it to the empty struct rather than padding it out. The
  // padded tree is what used to reach the encoder as a real empty field, and the
  // modal that hydrates through here writes full-arity tuples back anyway.
  it("degrades a tuple short of its components to the empty struct", () => {
    const param = {
      type: "tuple",
      components: [
        { name: "to", type: "address" },
        { name: "memo", type: "string" },
      ],
    } as never;
    expect(storageToArgForDisplay(param, `["${ADDR_A}"]`)).toEqual(["", ""]);
  });
});

describe("argsToTrees / treesToArgs (top-level)", () => {
  it("round-trips a mixed function signature without changing encoding", async () => {
    const fn = {
      type: "function",
      name: "act",
      stateMutability: "nonpayable",
      inputs: [
        { name: "amount", type: "uint256" },
        { name: "to", type: "address" },
        { name: "ids", type: "uint256[]" },
      ],
      outputs: [],
    } as const satisfies AbiFunction;

    const args = ["100", ADDR_B, '["1","2"]'];

    const trees = argsToTrees(fn.inputs, args);
    const back = treesToArgs(fn.inputs, trees as ArgValue[]);

    // Encoding through the existing pipeline must be byte-identical (AC8).
    const make = (a: string[]): CustomAction => ({
      type: "custom",
      contractAddress: ADDR_A,
      abi: [fn],
      functionName: "act",
      args: a,
    });
    const before = await encodeActions([make(args)], identityResolver);
    const after = await encodeActions([make(back)], identityResolver);
    expect(after.calldatas[0]).toBe(before.calldatas[0]);
  });

  it("refuses an arg count the inputs don't account for", () => {
    const inputs = [
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
    ] as const;

    expect(() => argsToTrees(inputs, ["100"])).toThrow(
      /Expected 2 arguments, got 1/,
    );
    expect(() => argsToTrees(inputs, ["100", ADDR_B, "extra"])).toThrow(
      /Expected 2 arguments, got 3/,
    );
  });
});

describe("treesToEncodeValues (live preview)", () => {
  it("produces values that encode identically to the canonical pipeline", async () => {
    const fn: AbiFunction = {
      type: "function",
      name: "submit",
      stateMutability: "nonpayable",
      inputs: [
        { name: "amount", type: "uint256" },
        { name: "active", type: "bool" },
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
    };

    const args = ["100", "true", `["7","${ADDR_B}"]`];
    const trees = argsToTrees(fn.inputs, args);

    const preview = encodeFunctionData({
      abi: [fn],
      functionName: "submit",
      args: treesToEncodeValues(fn.inputs, trees),
    });

    const make = (a: string[]): CustomAction => ({
      type: "custom",
      contractAddress: ADDR_A,
      abi: [fn],
      functionName: "submit",
      args: a,
    });
    const canonical = await encodeActions([make(args)], identityResolver);
    expect(preview).toBe(canonical.calldatas[0]);
  });
});

describe("decodeCalldataToArgs (paste & decode)", () => {
  const roundTrip = async (fn: AbiFunction, args: string[]) => {
    const make = (a: string[]): CustomAction => ({
      type: "custom",
      contractAddress: ADDR_A,
      abi: [fn],
      functionName: fn.name,
      args: a,
    });
    const { calldatas } = await encodeActions([make(args)], identityResolver);
    const calldata = calldatas[0] as Hex;

    const decoded = decodeCalldataToArgs(fn, calldata);
    const reencoded = await encodeActions([make(decoded)], identityResolver);
    expect(reencoded.calldatas[0]).toBe(calldata);
  };

  it("decodes scalars + dynamic array back to identical calldata", async () => {
    const fn = {
      type: "function",
      name: "transfer",
      stateMutability: "nonpayable",
      inputs: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "flags", type: "bool[]" },
      ],
      outputs: [],
    } as const satisfies AbiFunction;
    await roundTrip(fn, [ADDR_B, "100", "[true, false, true]"]);
  });

  it("decodes a struct (tuple) back to identical calldata", async () => {
    const fn = {
      type: "function",
      name: "submit",
      stateMutability: "nonpayable",
      inputs: [
        {
          name: "order",
          type: "tuple",
          components: [
            { name: "id", type: "uint256" },
            { name: "owner", type: "address" },
            { name: "active", type: "bool" },
          ],
        },
      ],
      outputs: [],
    } as const satisfies AbiFunction;
    await roundTrip(fn, [`["7","${ADDR_B}","true"]`]);
  });

  it("decodes an array of structs back to identical calldata", async () => {
    const fn = {
      type: "function",
      name: "batch",
      stateMutability: "nonpayable",
      inputs: [
        {
          name: "orders",
          type: "tuple[]",
          components: [
            { name: "id", type: "uint256" },
            { name: "amount", type: "uint256" },
          ],
        },
      ],
      outputs: [],
    } as const satisfies AbiFunction;
    await roundTrip(fn, ['[["1","10"],["2","20"]]']);
  });
});
