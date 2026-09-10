import {
  parseAbiItem,
  toFunctionSelector,
  type AbiFunction,
  type Hex,
} from "viem";

/**
 * Functions decoded even when the target is unverified: the multicall wrappers
 * the engine unpacks plus the ubiquitous token/governance calls. Parameter
 * names matter — humanizers and summary templates read them.
 */
const KNOWN_SIGNATURES = [
  // ERC20
  "function transfer(address to, uint256 amount)",
  "function approve(address spender, uint256 amount)",
  "function transferFrom(address from, address to, uint256 amount)",
  // Votes delegation
  "function delegate(address delegatee)",
  // ERC721 / ERC1155
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
  // Safe
  "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures)",
  // Multicall3
  "function aggregate((address target, bytes callData)[] calls)",
  "function aggregate3((address target, bool allowFailure, bytes callData)[] calls)",
  "function tryAggregate(bool requireSuccess, (address target, bytes callData)[] calls)",
  // OZ TimelockController
  "function schedule(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt, uint256 delay)",
  "function scheduleBatch(address[] targets, uint256[] values, bytes[] payloads, bytes32 predecessor, bytes32 salt, uint256 delay)",
  "function execute(address target, uint256 value, bytes payload, bytes32 predecessor, bytes32 salt)",
  "function executeBatch(address[] targets, uint256[] values, bytes[] payloads, bytes32 predecessor, bytes32 salt)",
  "function updateDelay(uint256 newDelay)",
  // Governor
  "function relay(address target, uint256 value, bytes data)",
];

const buildKnownFunctions = (): Map<Hex, AbiFunction> => {
  const map = new Map<Hex, AbiFunction>();
  for (const signature of KNOWN_SIGNATURES) {
    const fn = parseAbiItem(signature) as AbiFunction;
    map.set(toFunctionSelector(fn).toLowerCase() as Hex, fn);
  }
  return map;
};

let knownFunctions: Map<Hex, AbiFunction> | null = null;

export const getKnownFunction = (selector: Hex): AbiFunction | null => {
  knownFunctions ??= buildKnownFunctions();
  return knownFunctions.get(selector.toLowerCase() as Hex) ?? null;
};
