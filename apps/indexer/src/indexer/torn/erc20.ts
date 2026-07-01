import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address, getAddress } from "viem";

import { tokenTransfer } from "@/eventHandlers";
import {
  updateDelegatedSupply,
  updateCirculatingSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";

import { addLockedBalance, applyVotingPower, getDelegate } from "./shared";
import {
  MetricTypesEnum,
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  TreasuryAddresses,
  NonCirculatingAddresses,
} from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

export function TORNTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.TORN;

  // Contracts that custody locked TORN. A balance held here is voting power
  // owned by the locker, not the custody contract. TORN emits no
  // DelegateVotesChanged, so per-account voting power is derived from
  // lock/unlock Transfers in/out of these addresses. Add new lock contracts here.
  const lockCustodyAddresses = new Set<Address>(
    Object.values(NonCirculatingAddresses[daoId]).map((addr) =>
      getAddress(addr),
    ),
  );

  ponder.on("TORNToken:setup", async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on("TORNToken:Transfer", async ({ event, context }) => {
    const { from, to, value } = event.args;
    const { timestamp } = event.block;

    const cexAddressList = Object.values(CEXAddresses[daoId]);
    const dexAddressList = Object.values(DEXAddresses[daoId]);
    const lendingAddressList = Object.values(LendingAddresses[daoId]);
    const burningAddressList = Object.values(BurningAddresses[daoId]);
    const treasuryAddressList = Object.values(TreasuryAddresses[daoId]);
    const nonCirculatingAddressList = Object.values(
      NonCirculatingAddresses[daoId],
    );

    await tokenTransfer(
      context,
      daoId,
      {
        from,
        to,
        value,
        token: address,
        transactionHash: event.transaction.hash,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
      },
      {
        cex: cexAddressList,
        dex: dexAddressList,
        lending: lendingAddressList,
        burning: burningAddressList,
      },
    );

    await updateSupplyMetric(
      context,
      "lendingSupply",
      lendingAddressList,
      MetricTypesEnum.LENDING_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "cexSupply",
      cexAddressList,
      MetricTypesEnum.CEX_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "dexSupply",
      dexAddressList,
      MetricTypesEnum.DEX_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "treasury",
      treasuryAddressList,
      MetricTypesEnum.TREASURY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "nonCirculatingSupply",
      nonCirculatingAddressList,
      MetricTypesEnum.NON_CIRCULATING_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateTotalSupply(
      context,
      burningAddressList,
      MetricTypesEnum.TOTAL_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateCirculatingSupply(context, daoId, address, timestamp);

    // Track locks/unlocks: TORN moving in/out of governance custody — the
    // governor pre-v2, the TornadoVault post-v2 (GovernanceVaultUpgrade._
    // transferTokens). Both are lock sinks. Governor<->vault internal moves
    // (e.g. the v2 migration) have custody on both sides and net to zero, so
    // they are skipped. Governor-only accounting missed ~2.6M TORN in the Vault.
    const normalizedTo = getAddress(to);
    const normalizedFrom = getAddress(from);
    const toIsCustody = lockCustodyAddresses.has(normalizedTo);
    const fromIsCustody = lockCustodyAddresses.has(normalizedFrom);

    if (toIsCustody !== fromIsCustody) {
      const locker = toIsCustody ? normalizedFrom : normalizedTo;
      const delta = toIsCustody ? value : -value;

      // Only a genuine lock()/unlock() call moves voting power, and in that case
      // the locker is always the transaction sender: lock pulls TORN from
      // msg.sender, unlock sends it back to msg.sender. TORN also flows through
      // the governor for treasury purposes — proposal executions funding a
      // contract, batch grant payouts, the governor<->vault migration — where
      // the custody counterparty is some arbitrary address that is NOT the tx
      // sender. Counting those as locks/unlocks mints/burns phantom voting power
      // (e.g. proposal #6 funding a staking pool booked a -120k "unlock" against
      // a contract that never locked; treasury feeders got phantom locks). Skip
      // any custody transfer whose counterparty isn't the tx sender.
      // ponytail: misses locks routed via a Safe/relayer (counterparty != tx
      // sender) — both their lock and unlock are skipped so it stays consistent
      // (undercount, never negative). Tighten with a Governance call-trace check
      // if Safe-locked TORN needs to be captured.
      if (locker !== getAddress(event.transaction.from)) return;

      // Aggregate locked (delegated) supply.
      await updateDelegatedSupply(context, daoId, address, delta, timestamp);

      // Track the locker's per-account locked balance so a later delegation can
      // move the right amount of voting power (TORN has no DelegateVotesChanged).
      await addLockedBalance(context, locker, delta);

      // Voting power accrues to the locker's current delegate — itself unless it
      // has delegated to someone else.
      const recipient = await getDelegate(context, locker);
      await applyVotingPower(
        context,
        daoId,
        recipient,
        delta,
        event.transaction.hash,
        timestamp,
        event.log.logIndex,
      );
    }
  });

  // Voting power is derived from lock/unlock Transfers (see handler above), not
  // from these reward events — they carry only `account`, no amount. Kept as
  // no-ops so the configured events have handlers.
  // ponder.on("TORNGovernor:RewardUpdateSuccessful", async () => {});
  // ponder.on("TORNGovernor:RewardUpdateFailed", async () => {});
}
