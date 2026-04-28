import {
  encodeFunctionData,
  erc20Abi,
  isAddress,
  parseEther,
  parseUnits,
  toFunctionSignature,
  type AbiFunction,
  type Hex,
} from "viem";
import type { ProposalAction } from "@/features/create-proposal/types";

export type AddressResolver = (nameOrAddress: string) => Promise<`0x${string}`>;

export const encodeActions = async (
  actions: ProposalAction[],
  resolve: AddressResolver,
): Promise<{
  targets: `0x${string}`[];
  values: bigint[];
  calldatas: Hex[];
}> => {
  const targets: `0x${string}`[] = [];
  const values: bigint[] = [];
  const calldatas: Hex[] = [];

  for (const action of actions) {
    if (action.type === "eth-transfer") {
      targets.push(await resolve(action.recipient));
      values.push(parseEther(action.amount));
      calldatas.push("0x");
      continue;
    }

    if (action.type === "erc20-transfer") {
      const [tokenAddress, recipient] = await Promise.all([
        resolve(action.tokenAddress),
        resolve(action.recipient),
      ]);
      targets.push(tokenAddress);
      values.push(0n);
      calldatas.push(
        encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipient, parseUnits(action.amount, action.decimals)],
        }),
      );
      continue;
    }

    const target = await resolve(action.contractAddress);
    const ethValue = action.value ? BigInt(action.value) : 0n;

    if (action.calldata && action.calldata.trim().length > 0) {
      targets.push(target);
      values.push(ethValue);
      calldatas.push(action.calldata.trim() as Hex);
      continue;
    }

    // The picker stores the function signature (e.g. "transfer(address,uint256)")
    // so overloads stay distinct. Fall back to a name match for older drafts
    // that were saved before signatures were used.
    const fn = action.abi.find(
      (item): item is AbiFunction =>
        item.type === "function" &&
        (toFunctionSignature(item) === action.functionName ||
          item.name === action.functionName),
    );
    const resolvedArgs = await Promise.all(
      action.args.map((arg, i) =>
        fn?.inputs[i]?.type === "address" ? resolve(arg) : Promise.resolve(arg),
      ),
    );
    targets.push(target);
    values.push(ethValue);
    calldatas.push(
      encodeFunctionData({
        abi: action.abi,
        functionName: action.functionName,
        args: resolvedArgs,
      }),
    );
  }

  return { targets, values, calldatas };
};

export const makeAddressResolver = (
  getEnsAddress: (name: string) => Promise<`0x${string}` | null>,
): AddressResolver => {
  return async (input) => {
    const trimmed = input.trim();
    if (isAddress(trimmed)) return trimmed;
    const resolved = await getEnsAddress(trimmed);
    if (!resolved) throw new Error(`Could not resolve ENS name "${trimmed}"`);
    return resolved;
  };
};
