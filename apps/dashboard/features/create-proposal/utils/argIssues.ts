import type { AbiParameter } from "viem";

import {
  arityError,
  shapeOf,
  type ArgValue,
} from "@/features/create-proposal/utils/argTree";
import { validateSolidityArg } from "@/features/create-proposal/utils/validateArg";

import type { Issue } from "@/features/create-proposal/utils/issues";

/** The single answer to "can this argument be encoded as what it claims to be".
 *  Was three: `isArgComplete` for the editor, `tupleArityError` for a better arity
 *  message, and the JSON import's own pass — which disagreed with each other. */
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
    // Blank gets its own message: "is not a valid uint256" for an empty box reads
    // as malformed rather than missing.
    if (value.trim().length === 0) return [{ path, message: "Required" }];
    const invalid = validateSolidityArg(shape.type, value);
    return invalid ? [{ path, message: invalid }] : [];
  }

  if (!Array.isArray(value)) {
    return [{ path, message: `must be a JSON array for ${param.type}` }];
  }

  // Reported instead of the children: with the wrong number of entries, every
  // position past the first mismatch is compared with the wrong component.
  const arity = arityError(param, shape, value.length);
  if (arity) return [{ path, message: arity }];

  if (shape.kind === "array") {
    return value.flatMap((item, index) =>
      argIssues(shape.element, item, [...path, index]),
    );
  }
  // Named after the components where the ABI names them, so a problem three levels
  // deep reads `args[0].durations.total` and not `args[0].2.1`.
  return shape.components.flatMap((component, index) =>
    argIssues(component, value[index] ?? "", [
      ...path,
      component.name || index,
    ]),
  );
};

export const isArgComplete = (param: AbiParameter, value: ArgValue): boolean =>
  argIssues(param, value).length === 0;
