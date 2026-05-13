import { type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// --- Contracts ---

export const TOKEN_ADDRESS: Address =
  "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72";
export const GOVERNOR_ADDRESS: Address =
  "0x323A76393544d5ecca80cd6ef2A560C6a395b7E3";
export const FORK_BLOCK = 21630000;

// --- Accounts ---

export const RELAYER_KEY: Hex =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
export const TEST_USER_KEY: Hex =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
export const BROKE_USER_KEY: Hex =
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
export const PROPOSER_KEY: Hex =
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6";

export const RELAYER_ADDRESS: Address =
  privateKeyToAccount(RELAYER_KEY).address;
export const TEST_USER_ADDRESS: Address =
  privateKeyToAccount(TEST_USER_KEY).address;
export const DELEGATEE_ADDRESS: Address =
  privateKeyToAccount(BROKE_USER_KEY).address;
export const PROPOSER_ADDRESS: Address =
  privateKeyToAccount(PROPOSER_KEY).address;

export const WHALE_ADDRESS: Address =
  "0x28C6c06298d514Db089934071355E5743bf21d60";

export const DEAD_ADDRESS: Address =
  "0x000000000000000000000000000000000000dEaD";

// --- EIP-712 domains ---

export const TOKEN_DOMAIN = {
  name: "Ethereum Name Service",
  version: "1",
  chainId: 1,
  verifyingContract: TOKEN_ADDRESS,
} as const;

export const GOVERNOR_DOMAIN = {
  name: "ENS Governor",
  version: "1",
  chainId: 1,
  verifyingContract: GOVERNOR_ADDRESS,
} as const;
