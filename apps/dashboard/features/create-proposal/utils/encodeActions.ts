import {
  encodeFunctionData,
  erc20Abi,
  isAddress,
  parseEther,
  parseUnits,
  toFunctionSignature,
  type AbiFunction,
  type AbiParameter,
  type Hex,
} from "viem";
import type { ProposalAction } from "@/features/create-proposal/types";

export type AddressResolver = (nameOrAddress: string) => Promise<`0x${string}`>;
const parseArg = async (
  type: string,
  components: readonly AbiParameter[] | undefined,
  value: unknown,
  resolve: AddressResolver,
): Promise<unknown> => {
  const arrayMatch = type.match(/^(.*)\[(\d*)\]$/);
  if (arrayMatch) {
    const elementType = arrayMatch[1];
    const fixedLength = arrayMatch[2] ? Number(arrayMatch[2]) : null;

    const arr = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(arr)) {
      throw new Error(`Expected JSON array for type "${type}".`);
    }

    if (fixedLength !== null && arr.length !== fixedLength) {
      throw new Error(
        `Expected array of length ${fixedLength} for type "${type}", got ${arr.length}.`,
      );
    }

    return Promise.all(
      arr.map((item) => parseArg(elementType, components, item, resolve)),
    );
  }

  if (type.startsWith("tuple")) {
    const obj = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(obj) || !components) {
      throw new Error(`Expected JSON array for tuple type "${type}".`);
    }
    return Promise.all(
      components.map((c, i) =>
        parseArg(
          c.type,
          (c as { components?: readonly AbiParameter[] }).components,
          obj[i],
          resolve,
        ),
      ),
    );
  }

  if (type === "address") {
    if (typeof value !== "string") {
      throw new Error(`Expected string for address, got ${typeof value}.`);
    }
    return resolve(value);
  }

  if (type === "bool") {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    throw new Error(`Expected boolean, got "${String(value)}".`);
  }

  return value;
};

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
    const resolvedArgs = await Promise.all(
      action.args.map((arg, i) => {
        const input = fn.inputs[i];
        if (!input) return Promise.resolve(arg);
        return parseArg(
          input.type,
          (input as { components?: readonly AbiParameter[] }).components,
          arg,
          resolve,
        );
      }),
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
    if (isAddress(trimmed)) return trimmed;
    const resolved = await getEnsAddress(trimmed);
    if (!resolved) throw new Error(`Could not resolve ENS name "${trimmed}"`);
    return resolved;
  };
};
