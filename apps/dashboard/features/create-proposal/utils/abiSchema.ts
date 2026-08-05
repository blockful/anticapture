import { AbiParameter as AbiParameterSchema } from "abitype/zod";
import type { AbiFunction, AbiParameter } from "viem";
import { z } from "zod";

import { shapeOf } from "@/features/create-proposal/utils/argTree";

/*
 * Whether an ABI entry is well formed enough to encode a call with.
 *
 * The Solidity type grammar lives in `abitype`, which viem is already built on:
 * `uint257`, `uint255`, `bytes33`, `bytes0`, `fixed128x18` and a `tuple` with no
 * `components` are all refused by its parameter schema, recursively. Hand-written
 * regexes for the same grammar were the larger half of this file's predecessor,
 * and the nonsense widths are the ones that mattered — viem matches `uint257` on
 * `startsWith("uint")` and quietly encodes something the declared type never
 * described.
 */

/**
 * Enough of a parameter for viem's formatters and the argument walk to get past
 * it without throwing: a string `type`, all the way down.
 *
 * Deliberately not `abitype`'s schema. The two questions are different and both
 * are needed — "can this be read at all" decides whether a function belongs in
 * the modal's list, and "is this type encodable" is what produces the message
 * naming the offending type. Judging readability with the grammar would drop such
 * a function from the list entirely, and `customActionIssues` would then report
 * the far less useful "is not a function in this ABI".
 */
const StructuralParameter: z.ZodType<{ type: string }> = z.lazy(() =>
  z.object({
    type: z.string(),
    components: z.array(StructuralParameter).optional(),
  }),
);

/**
 * `abitype`'s own function schema is stricter than this form can be: it requires
 * `outputs` and `stateMutability`, and a hand-written minimal ABI —
 * `{ "type": "function", "name": "transfer", "inputs": [...] }` — carries
 * neither, while being exactly what someone pastes. A name is required though:
 * the modal selects a function by name, and a nameless one could be neither
 * chosen nor hydrated on edit.
 */
const AbiFunctionSchema = z.object({
  type: z.literal("function"),
  name: z.string().min(1),
  inputs: z.array(StructuralParameter),
});

/**
 * Validated, never rebuilt: only the verdict is used, and the caller keeps the
 * item it already had. These schemas strip the keys they don't declare, and
 * `stateMutability` is one of them — reading the parsed output back would lose
 * the field `findAbiFunction` needs to keep `view` functions out of the list.
 */
export const isWellFormedFunction = (item: unknown): item is AbiFunction =>
  AbiFunctionSchema.safeParse(item).success;

/**
 * `function` is a legal ABI type that viem's encoder refuses
 * (`InvalidAbiEncodingType`), so it is the one thing the grammar accepts and this
 * form cannot. Everything else `abitype` rejects for us.
 */
const declaresFunctionType = (param: AbiParameter): boolean => {
  const shape = shapeOf(param);
  if (shape.kind === "array") return declaresFunctionType(shape.element);
  if (shape.kind === "tuple")
    return shape.components.some(declaresFunctionType);
  return shape.type === "function";
};

/** True when viem can actually encode a value for this parameter. */
export const isEncodableParam = (param: AbiParameter): boolean =>
  AbiParameterSchema.safeParse(param).success && !declaresFunctionType(param);
