import { keccak256, stringToBytes, zeroHash } from "viem";

/**
 * Role identifiers are `keccak256("NAME_ROLE")`, so a hash can be named by
 * hashing the usual suspects and looking it up. These are the OpenZeppelin
 * defaults plus the names governance contracts commonly declare; anything
 * else stays a hash, which the row shows next to the name when it does
 * resolve, so a reader can always check.
 */
const ROLE_NAMES = [
  "ADMIN_ROLE",
  "MINTER_ROLE",
  "BURNER_ROLE",
  "PAUSER_ROLE",
  "UPGRADER_ROLE",
  "OPERATOR_ROLE",
  "PROPOSER_ROLE",
  "EXECUTOR_ROLE",
  "CANCELLER_ROLE",
  "TIMELOCK_ADMIN_ROLE",
  "GOVERNOR_ROLE",
  "GUARDIAN_ROLE",
  "MANAGER_ROLE",
  "CONTROLLER_ROLE",
  "TREASURER_ROLE",
  "RELAYER_ROLE",
  "EMERGENCY_ROLE",
  "EMERGENCY_ADMIN_ROLE",
  "RISK_ADMIN_ROLE",
  "POOL_ADMIN_ROLE",
  "ASSET_LISTING_ADMIN_ROLE",
  "BRIDGE_ROLE",
  "ORACLE_ROLE",
  "KEEPER_ROLE",
  "REBALANCER_ROLE",
  "WHITELIST_ROLE",
  "VETO_ROLE",
  "VETOER_ROLE",
  "SETTLER_ROLE",
  "DISTRIBUTOR_ROLE",
  "REGISTRAR_ROLE",
];

let rolesByHash: Map<string, string> | null = null;

const getRolesByHash = (): Map<string, string> => {
  if (rolesByHash) return rolesByHash;
  rolesByHash = new Map();
  // AccessControl's admin role is the zero hash, not the hash of its name.
  rolesByHash.set(zeroHash, "DEFAULT_ADMIN_ROLE");
  for (const name of ROLE_NAMES) {
    rolesByHash.set(keccak256(stringToBytes(name)).toLowerCase(), name);
  }
  return rolesByHash;
};

/** The role name behind a bytes32 hash, or undefined when it is not a known one. */
export const lookupRoleName = (hash: string): string | undefined =>
  getRolesByHash().get(hash.toLowerCase());
