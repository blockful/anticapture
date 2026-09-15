import type {
  DecodedCall,
  DecodedParam,
} from "@/shared/components/decoder/types";
import {
  unpackedParamIndices,
  unpackedPayloadIndex,
} from "@/shared/services/decoder";

export const SAFE_EXEC_SIGNATURE =
  "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)";

export type ParamLayout = {
  /** Rows shown in the params box. */
  primary: DecodedParam[];
  /** The Safe `operation` byte, rendered as its own row with a badge. */
  operation?: DecodedParam;
  /** Rows folded behind one disclosure line. */
  secondary?: { label: string; params: DecodedParam[] };
  /** The `bytes` row the subcall list was unpacked from, if any. */
  payload?: DecodedParam;
};

/**
 * Which decoded parameters the card lists, and how. A Safe transaction keeps
 * `to`, `value` and `data` in view, lifts `operation` into its own row and
 * folds the six execution parameters (gas limits, gas price, refund
 * receiver, signatures) behind one line. A batch the decoder unpacked drops
 * the parallel arrays its subcall list already spells out.
 *
 * `params` is the call's params with the truncation note removed; the note
 * is always last, so positions still match the ABI.
 */
export const layoutParams = (
  call: DecodedCall,
  params: DecodedParam[],
): ParamLayout => {
  const payloadIndex = unpackedPayloadIndex(call);
  const payload = payloadIndex === undefined ? undefined : params[payloadIndex];
  if (call.signature === SAFE_EXEC_SIGNATURE && params.length >= 4) {
    const execution = params.slice(4);
    return {
      payload,
      primary: params.slice(0, 3),
      operation: params[3],
      secondary:
        execution.length > 0
          ? {
              label: `${execution.length} execution parameters: gas limits, gas price, refund receiver, signatures`,
              params: execution,
            }
          : undefined,
    };
  }
  const unpacked = unpackedParamIndices(call);
  return {
    payload,
    primary: params.filter((_, index) => !unpacked.has(index)),
  };
};
