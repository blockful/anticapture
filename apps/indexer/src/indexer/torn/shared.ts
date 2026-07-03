import { Context } from "ponder:registry";
import {
  accountBalance,
  accountPower,
  votingPowerHistory,
} from "ponder:schema";
import { Address, getAddress, Hex, zeroAddress } from "viem";

import { ensureAccountExists } from "@/eventHandlers/shared";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

// Per-account locked TORN lives in the Governance contract, not the ERC20. We
// store it in an `accountBalance` row keyed by the governor address so it never
// collides with the wallet-balance row (keyed by the TORN token address).
const TORN_LOCK_KEY = getAddress(
  CONTRACT_ADDRESSES[DaoIdEnum.TORN].governor.address,
);

const TORN_TOKEN_ADDRESS = getAddress(
  CONTRACT_ADDRESSES[DaoIdEnum.TORN].token.address,
);

/** Net TORN an account has locked into governance — drives its voting power. */
export const getLockedBalance = async (
  context: Context,
  account: Address,
): Promise<bigint> => {
  const row = await context.db.find(accountBalance, {
    accountId: getAddress(account),
    tokenId: TORN_LOCK_KEY,
  });
  return row?.balance ?? 0n;
};

/** Apply a delta to an account's locked balance. */
export const addLockedBalance = async (
  context: Context,
  account: Address,
  delta: bigint,
): Promise<void> => {
  await ensureAccountExists(context, account);
  await context.db
    .insert(accountBalance)
    .values({
      accountId: getAddress(account),
      tokenId: TORN_LOCK_KEY,
      balance: delta,
    })
    .onConflictDoUpdate((current) => ({
      balance: current.balance + delta,
    }));
};

/** Whoever an account currently delegates to (itself when never delegated). */
export const getDelegate = async (
  context: Context,
  account: Address,
): Promise<Address> => {
  const normalized = getAddress(account);
  const row = await context.db.find(accountBalance, {
    accountId: normalized,
    tokenId: TORN_TOKEN_ADDRESS,
  });
  return !row || row.delegate === zeroAddress ? normalized : row.delegate;
};

/**
 * Add `delta` voting power to `account`: bump accountPower and append a
 * votingPowerHistory row. TORN emits no DelegateVotesChanged, so every voting
 * power change — lock/unlock and delegation shifts alike — is synthesized here.
 */
export const applyVotingPower = async (
  context: Context,
  daoId: DaoIdEnum,
  account: Address,
  delta: bigint,
  txHash: Hex,
  timestamp: bigint,
  logIndex: number,
): Promise<void> => {
  if (delta === 0n) return;
  const normalized = getAddress(account);
  await ensureAccountExists(context, normalized);

  const { votingPower } = await context.db
    .insert(accountPower)
    .values({ accountId: normalized, daoId, votingPower: delta })
    .onConflictDoUpdate((current) => ({
      votingPower: current.votingPower + delta,
    }));

  await context.db
    .insert(votingPowerHistory)
    .values({
      daoId,
      transactionHash: txHash,
      accountId: normalized,
      votingPower,
      delta,
      deltaMod: delta > 0n ? delta : -delta,
      timestamp,
      logIndex,
    })
    .onConflictDoNothing();
};
