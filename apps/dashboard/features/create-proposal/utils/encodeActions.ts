import {
  encodeFunctionData,
  erc20Abi,
  parseEther,
  parseUnits,
  toFunctionSignature,
  type AbiFunction,
  type Hex,
} from "viem";
import { isAddressLike, toChecksumAddress } from "@/shared/utils/address";
import {
  argsToTrees,
  resolveAddressesInTrees,
  treesToEncodeValues,
} from "@/features/create-proposal/utils/argTree";
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

    const fn = action.abi.find(
      (item): item is AbiFunction =>
        item.type === "function" &&
        (toFunctionSignature(item) === action.functionName ||
          item.name === action.functionName),
    );
    if (!fn) {
      throw new Error(
        `Function "${action.functionName}" not found in the action's ABI.`,
      );
    }
    // The strict variant of the conversion the preview runs: the preview may degrade a
    // half-typed array to an empty one, and an action from a shared or API draft never
    // passed `ProposalFormSchema`, so this is the last place to catch a malformed arg.
    const resolvedArgs = treesToEncodeValues(
      fn.inputs,
      await resolveAddressesInTrees(
        fn.inputs,
        argsToTrees(fn.inputs, action.args),
        resolve,
      ),
    );
    targets.push(target);
    values.push(ethValue);
    calldatas.push(
      encodeFunctionData({
        abi: [fn],
        functionName: fn.name,
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
    // Checksum-agnostic: matched strictly, a miscased address falls through to the ENS
    // branch and fails with `Could not resolve ENS name 0x39D3…` mid-publish, for
    // something that was never a name and that the form accepted.
    if (isAddressLike(trimmed)) return toChecksumAddress(trimmed);
    const resolved = await getEnsAddress(trimmed);
    if (!resolved) throw new Error(`Could not resolve ENS name "${trimmed}"`);
    return resolved;
  };
};
