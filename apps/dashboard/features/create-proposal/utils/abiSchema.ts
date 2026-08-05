import { AbiParameter as AbiParameterSchema } from "abitype/zod";
import type { AbiFunction, AbiParameter } from "viem";
import { z } from "zod";

import { shapeOf } from "@/features/create-proposal/utils/argTree";

/* The Solidity type grammar lives in `abitype`, which viem is built on: uint257,
 * uint255, bytes33, bytes0, fixed128x18 and a tuple with no components are all
 * refused by its parameter schema, recursively. */

/** Readable, not necessarily encodable — a looser question, and a separate one.
 *  Judging readability with the grammar would drop the offending function from the
 *  ABI list, losing the message that names the bad type. */
const StructuralParameter: z.ZodType<{ type: string }> = z.lazy(() =>
  z.object({
    type: z.string(),
    components: z.array(StructuralParameter).optional(),
  }),
);

/** `abitype`'s own function schema requires `outputs` and `stateMutability`; a
 *  hand-written minimal ABI carries neither and is exactly what people paste. */
const AbiFunctionSchema = z.object({
  type: z.literal("function"),
  name: z.string().min(1),
  inputs: z.array(StructuralParameter),
});

/** Validated, never rebuilt: these schemas strip `stateMutability`, which
 *  `findAbiFunction` needs to keep `view` functions out of the list. */
export const isWellFormedFunction = (item: unknown): item is AbiFunction =>
  AbiFunctionSchema.safeParse(item).success;

/** `function` is legal ABI that viem's encoder refuses (`InvalidAbiEncodingType`),
 *  so it is the one thing the grammar accepts and this form cannot. */
const declaresFunctionType = (param: AbiParameter): boolean => {
  const shape = shapeOf(param);
  if (shape.kind === "array") return declaresFunctionType(shape.element);
  if (shape.kind === "tuple")
    return shape.components.some(declaresFunctionType);
  return shape.type === "function";
};

export const isEncodableParam = (param: AbiParameter): boolean =>
  AbiParameterSchema.safeParse(param).success && !declaresFunctionType(param);
