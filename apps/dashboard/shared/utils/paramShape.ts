import type { AbiParameter } from "viem";

type ArrayInfo = { elementType: string; length: number | null };

export const parseArrayType = (type: string): ArrayInfo | null => {
  const match = type.match(/^(.*)\[(\d*)\]$/);
  if (!match) return null;
  return { elementType: match[1], length: match[2] ? Number(match[2]) : null };
};

const getComponents = (param: AbiParameter): readonly AbiParameter[] =>
  (param as { components?: readonly AbiParameter[] }).components ?? [];

/** What a parameter is, decided once. Every walk over an `AbiParameter` starts
 *  with the same array/tuple/leaf question; that preamble was copied into ten
 *  functions across four files, and the copies drifted. */
export type ParamShape =
  | { kind: "array"; element: AbiParameter; length: number | null }
  | { kind: "tuple"; components: readonly AbiParameter[] }
  | { kind: "leaf"; type: string };

export const shapeOf = (param: AbiParameter): ParamShape => {
  const array = parseArrayType(param.type);
  if (array) {
    return {
      kind: "array",
      element: { ...param, type: array.elementType } as AbiParameter,
      length: array.length,
    };
  }
  if (param.type === "tuple") {
    return { kind: "tuple", components: getComponents(param) };
  }
  return { kind: "leaf", type: param.type };
};

export const expectedLength = (shape: ParamShape): number | null => {
  if (shape.kind === "tuple") return shape.components.length;
  if (shape.kind === "array") return shape.length;
  return null;
};
