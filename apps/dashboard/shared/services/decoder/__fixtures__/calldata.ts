import { encodeFunctionData, parseAbi, type Address, type Hex } from "viem";

/**
 * Deterministic calldata fixtures shaped like real governance payloads,
 * built with encodeFunctionData so tests and stories never depend on the
 * network. Layouts mirror mainnet contracts: USDC transfer, an OZ Timelock
 * scheduleBatch, and a Safe execTransaction wrapping Multicall3.aggregate3.
 */

export const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address;
export const RECIPIENT =
  "0x26D5EB37002152186ec86B9835ecAf32846bC0DD" as Address;
export const SPENDER = "0x93a8f8072337F2D1Ff2D019761cE0ABa39723d7B" as Address;
export const MULTICALL3 =
  "0xcA11bde05977b3631167028862bE2a173976CA11" as Address;
export const SAFE = "0x73f9ccC34d14754dEfD9acdC9C4F4E37b184A639" as Address;
export const TIMELOCK = "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7" as Address;

const ERC20_ABI = parseAbi([
  "function transfer(address to, uint256 amount)",
  "function approve(address spender, uint256 amount)",
]);

const MULTICALL3_ABI = parseAbi([
  "function aggregate3((address target, bool allowFailure, bytes callData)[] calls)",
]);

const SAFE_ABI = parseAbi([
  "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures)",
]);

const TIMELOCK_ABI = parseAbi([
  "function scheduleBatch(address[] targets, uint256[] values, bytes[] payloads, bytes32 predecessor, bytes32 salt, uint256 delay)",
]);

/** transfer(RECIPIENT, 25,000 USDC in 6-decimal raw units). */
export const USDC_TRANSFER: Hex = encodeFunctionData({
  abi: ERC20_ABI,
  functionName: "transfer",
  args: [RECIPIENT, 25_000_000_000n],
});

export const USDC_APPROVE: Hex = encodeFunctionData({
  abi: ERC20_ABI,
  functionName: "approve",
  args: [SPENDER, 1_000_000_000n],
});

/** Multicall3.aggregate3 batching the transfer and the approve above. */
export const AGGREGATE3_BATCH: Hex = encodeFunctionData({
  abi: MULTICALL3_ABI,
  functionName: "aggregate3",
  args: [
    [
      { target: USDC, allowFailure: false, callData: USDC_TRANSFER },
      { target: USDC, allowFailure: true, callData: USDC_APPROVE },
    ],
  ],
});

export const safeExecTransaction = (
  to: Address,
  data: Hex,
  operation: 0 | 1 = 0,
): Hex =>
  encodeFunctionData({
    abi: SAFE_ABI,
    functionName: "execTransaction",
    args: [
      to,
      0n,
      data,
      operation,
      0n,
      0n,
      0n,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      "0x",
    ],
  });

/** The marquee recursion case: a Safe call wrapping a Multicall3 batch. */
export const SAFE_WRAPPING_AGGREGATE3: Hex = safeExecTransaction(
  MULTICALL3,
  AGGREGATE3_BATCH,
);

/** scheduleBatch of a token transfer plus a plain 1.5 ETH transfer. */
export const SCHEDULE_BATCH: Hex = encodeFunctionData({
  abi: TIMELOCK_ABI,
  functionName: "scheduleBatch",
  args: [
    [USDC, RECIPIENT],
    [0n, 1_500_000_000_000_000_000n],
    [USDC_TRANSFER, "0x"],
    `0x${"0".repeat(64)}`,
    `0x${"1".padStart(64, "0")}`,
    172_800n,
  ],
});
