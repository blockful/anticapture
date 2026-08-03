import type { ProposalFormValues } from "@/features/create-proposal/schema";
import type { PendingAction } from "@/features/create-proposal/utils/parseProposalJson";

type FormAction = ProposalFormValues["actions"][number];

/** Reads `decimals()` off an ERC-20. Rejects when the call fails. */
export type DecimalsReader = (tokenAddress: string) => Promise<number>;

export type ResolveDecimalsResult =
  | { ok: true; actions: FormAction[] }
  | { ok: false; error: string };

/**
 * Settles the `decimals` of every imported ERC-20 transfer against the token
 * contract, the way the add-transfer modal does before it builds an action.
 *
 * A pasted `decimals` is a claim about a contract the user doesn't control, and
 * `encodeActions` hands it straight to `parseUnits`. Trusting it lets an import
 * of `{ amount: "1", decimals: 18 }` against USDC display as a 1 token transfer
 * while encoding 1e18 base units, a million times the intended payment, with
 * nothing on screen showing the difference. So the value is only ever accepted
 * when the contract agrees; when it's absent, the contract supplies it.
 *
 * Actions of other types pass through untouched, so a document with no ERC-20
 * transfer never needs an RPC round trip.
 */
export const resolveImportedDecimals = async (
  actions: PendingAction[],
  readDecimals: DecimalsReader,
): Promise<ResolveDecimalsResult> => {
  const resolved: FormAction[] = [];

  for (const [index, action] of actions.entries()) {
    if (action.type !== "erc20-transfer") {
      resolved.push(action);
      continue;
    }

    let onchain: number;
    try {
      onchain = await readDecimals(action.tokenAddress);
    } catch {
      return {
        ok: false,
        error: `actions[${index}].tokenAddress: couldn't read decimals from ${action.tokenAddress}. Check the address points to an ERC-20 on this network.`,
      };
    }

    if (!Number.isInteger(onchain) || onchain < 0) {
      return {
        ok: false,
        error: `actions[${index}].tokenAddress: ${action.tokenAddress} reported decimals of "${String(onchain)}", which isn't a token this form can encode.`,
      };
    }

    if (action.decimals !== undefined && action.decimals !== onchain) {
      return {
        ok: false,
        error: `actions[${index}].decimals: the token reports ${onchain}, not ${action.decimals}. Publishing this would transfer the wrong amount.`,
      };
    }

    resolved.push({ ...action, decimals: onchain });
  }

  return { ok: true, actions: resolved };
};

/** True when the document needs an RPC round trip to be importable. */
export const needsDecimalsLookup = (actions: PendingAction[]): boolean =>
  actions.some((action) => action.type === "erc20-transfer");
