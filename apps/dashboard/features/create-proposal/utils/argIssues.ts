import type { AbiParameter } from "viem";

import {
  arityError,
  shapeOf,
  type ArgValue,
} from "@/features/create-proposal/utils/argTree";
import { validateSolidityArg } from "@/features/create-proposal/utils/validateArg";

import type { Issue } from "@/features/create-proposal/utils/issues";

/**
 * Everything that can be wrong with one argument value, against the type its ABI
 * declares.
 *
 * The single answer to "can this argument be encoded as what it claims to be".
 * It used to be three: `isArgComplete` returned a boolean for the form,
 * `tupleArityError` re-walked the same tree for a better tuple message, and the
 * JSON import's `convertValue` checked the same rules a third time on its way to
 * building a tree. Three walks meant three chances to disagree — and they did, on
 * arity messages and on whether an empty dynamic array counted as complete.
 *
 * Children are named after their components where the ABI names them, so a
 * problem three levels into a tuple reads `args[0].durations.total` rather than
 * `args[0].2.1`.
 */
export const argIssues = (
  param: AbiParameter,
  value: ArgValue,
  path: (string | number)[] = [],
): Issue[] => {
  const shape = shapeOf(param);

  if (shape.kind === "leaf") {
    if (typeof value !== "string") {
      return [{ path, message: `must be a single value for ${shape.type}` }];
    }
    // Blank is its own message: "is not a valid uint256" for an empty box reads
    // as a malformed figure rather than a missing one.
    if (value.trim().length === 0) return [{ path, message: "Required" }];
    const invalid = validateSolidityArg(shape.type, value);
    return invalid ? [{ path, message: invalid }] : [];
  }

  if (!Array.isArray(value)) {
    return [{ path, message: `must be a JSON array for ${param.type}` }];
  }

  // Reported instead of the children, not alongside them: with the wrong number
  // of entries, every position past the first mismatch is being compared with
  // the wrong component.
  const arity = arityError(param, shape, value.length);
  if (arity) return [{ path, message: arity }];

  if (shape.kind === "array") {
    return value.flatMap((item, index) =>
      argIssues(shape.element, item, [...path, index]),
    );
  }
  return shape.components.flatMap((component, index) =>
    argIssues(component, value[index] ?? "", [
      ...path,
      component.name || index,
    ]),
  );
};

/**
 * The same question as a boolean, for the editor: it enables its confirm button
 * rather than explaining itself, so it only needs the verdict.
 */
export const isArgComplete = (param: AbiParameter, value: ArgValue): boolean =>
  argIssues(param, value).length === 0;
