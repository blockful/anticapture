import type { ProposalFormValues } from "@/features/create-proposal/schema";
import type { PendingAction } from "@/features/create-proposal/utils/parseProposalJson";

type FormAction = ProposalFormValues["actions"][number];

export type DecimalsReader = (tokenAddress: string) => Promise<number>;

export type ResolveDecimalsResult =
  | { ok: true; actions: FormAction[] }
  | { ok: false; error: string };

/** Settles every imported ERC-20 transfer's `decimals` against the token contract.
 *  A pasted value goes straight to `parseUnits`: `{ amount: "1", decimals: 18 }`
 *  against USDC displays as 1 token and encodes 1e18 base units. So it is accepted
 *  only when the contract agrees, and supplied by it when absent. */
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

export const needsDecimalsLookup = (actions: PendingAction[]): boolean =>
  actions.some((action) => action.type === "erc20-transfer");
