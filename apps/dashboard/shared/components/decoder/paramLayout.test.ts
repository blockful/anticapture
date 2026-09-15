import { toFunctionSelector } from "viem";

import {
  layoutParams,
  SAFE_EXEC_SIGNATURE,
} from "@/shared/components/decoder/paramLayout";
import type {
  DecodedCall,
  DecodedParam,
} from "@/shared/components/decoder/types";

const param = (name: string, type = "uint256"): DecodedParam => ({
  name,
  type,
  value: "0",
});

const call = (overrides: Partial<DecodedCall>): DecodedCall => ({
  chainId: 1,
  selector: "0x00000000",
  abiSource: "known",
  params: [],
  raw: "0x",
  depth: 0,
  warnings: [],
  summary: null,
  ...overrides,
});

const SAFE_EXEC_PARAMS = [
  param("to", "address"),
  param("value"),
  param("data", "bytes"),
  param("operation", "uint8"),
  param("safeTxGas"),
  param("baseGas"),
  param("gasPrice"),
  param("gasToken", "address"),
  param("refundReceiver", "address"),
  param("signatures", "bytes"),
];

describe("layoutParams", () => {
  test("a Safe transaction keeps to/value/data, lifts operation and folds the rest", () => {
    const layout = layoutParams(
      call({
        selector: toFunctionSelector(SAFE_EXEC_SIGNATURE),
        signature: SAFE_EXEC_SIGNATURE,
      }),
      SAFE_EXEC_PARAMS,
    );
    expect(layout.primary.map((p) => p.name)).toEqual(["to", "value", "data"]);
    expect(layout.operation?.name).toBe("operation");
    expect(layout.secondary?.params.map((p) => p.name)).toEqual([
      "safeTxGas",
      "baseGas",
      "gasPrice",
      "gasToken",
      "refundReceiver",
      "signatures",
    ]);
    expect(layout.secondary?.label).toBe(
      "6 execution parameters: gas limits, gas price, refund receiver, signatures",
    );
  });

  test("a Safe transaction the budget cut short folds only what remains", () => {
    const layout = layoutParams(
      call({
        selector: toFunctionSelector(SAFE_EXEC_SIGNATURE),
        signature: SAFE_EXEC_SIGNATURE,
      }),
      SAFE_EXEC_PARAMS.slice(0, 4),
    );
    expect(layout.primary).toHaveLength(3);
    expect(layout.operation?.name).toBe("operation");
    expect(layout.secondary).toBeUndefined();
  });

  test("an unpacked proposal lists only the description", () => {
    const signature = "propose(address[],uint256[],bytes[],string)";
    const params = [
      param("targets", "address[]"),
      param("values", "uint256[]"),
      param("calldatas", "bytes[]"),
      param("description", "string"),
    ];
    const action = { ...call({ depth: 1 }), index: 0 };
    const layout = layoutParams(
      call({
        selector: toFunctionSelector(signature),
        signature,
        subcalls: [action],
        subcallCount: 1,
      }),
      params,
    );
    expect(layout.primary.map((p) => p.name)).toEqual(["description"]);
    expect(layout.operation).toBeUndefined();
    expect(layout.secondary).toBeUndefined();
  });

  test("a proposal whose arrays could not be unpacked keeps them in view", () => {
    const signature = "propose(address[],uint256[],bytes[],string)";
    const params = [
      param("targets", "address[]"),
      param("values", "uint256[]"),
      param("calldatas", "bytes[]"),
      param("description", "string"),
    ];
    const layout = layoutParams(
      call({
        selector: toFunctionSelector(signature),
        signature,
        subcalls: [],
        subcallCount: 0,
      }),
      params,
    );
    expect(layout.primary).toEqual(params);
  });

  test("any other call lists every parameter", () => {
    const params = [param("to", "address"), param("amount")];
    expect(layoutParams(call({}), params).primary).toEqual(params);
  });
});
